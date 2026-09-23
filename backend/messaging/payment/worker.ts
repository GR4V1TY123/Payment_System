// worker for processing payments from RabbitMQ queue
import amqp from 'amqplib';
import { handlePayment } from './handlePayments';
import { workerLogger } from '../../utils/logger';
import { paymentsDeadLettered, paymentsFailed, paymentsInProgress, paymentsRetried, paymentsSuccessful } from '../../utils/metrics';
import { buildFastify } from '../../app';
import client from 'prom-client';
import { pool } from '../db';
import { getPaymentByIdQuery, getPaymentDetailsWithNamesQuery } from '../../query/paymentQueries';
import { redisPublish } from '../../utils/redis/redisPublisher';
import connection from '../rabbitmq';
import { sendToMailQueue } from '../mail/sendToQueue';

const MAX_RETRIES = 3;

const workerServer = buildFastify();
const register = client.register;

workerServer.get('/health', async (request, reply) => {
    reply.status(200).send({
        success: true,
        message: 'payment worker is healthy'
    });
})

workerServer.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
})

await workerServer.listen({
    port: Number(process.env.WORKER_PORT ?? 5000),
    host: '0.0.0.0'
});

const queue = 'payment_queue';
const baseTTL = 2000; // Base TTL for retry queues in milliseconds
const retryQueues = ["retry_queue_1", "retry_queue_2", "retry_queue_3"];

const channel = await connection.createConfirmChannel();
await channel.assertQueue(queue, {
    durable: true
});

channel.prefetch(1); // Process one message at a time

// Set up retry queues with dead-lettering and TTL
for (const q of retryQueues) {
    await channel.assertQueue(q, {
        durable: true,
        arguments: {
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": queue
        }
    });
}

// set up deadletter queue for messages that exceed max retries
await channel.assertQueue("payment_dlq", {
    durable: true,
});

channel.consume(queue, async (msg) => {
    if (msg) {

        workerLogger.info({
            message: 'Received payment data from RabbitMQ queue for processing',
            content: msg.content.toString()
        });

        const paymentData = JSON.parse(msg.content.toString());
        const paymentId = paymentData.payment_id;
        const paymentType = paymentData.payment_type;

        paymentsInProgress.inc({ payment_type: paymentType });

        const attemptCount = Number(msg.properties.headers?.['x-attempts'] ?? 0);

        try {
            
            const payment = (await pool.query(getPaymentDetailsWithNamesQuery(BigInt(paymentId)))).rows[0];
            if (!payment) {
                throw new Error(`Payment not found for payment ID: ${paymentId}`);
            }

            await redisPublish("payment.updated", {
                payment_id: paymentId,
                status: 'processing',
                amount: payment?.amount,
                currency: payment?.currency,
                account_id: payment?.sender_id?.toString(),
                payment_type: paymentType
            });

            const result = await handlePayment(paymentId, paymentType);

            // Acknowledge the message after processing
            if (!result.success) {
                if (result.retryable) {
                    throw new Error(`Retryable error processing payment: ${result.message}`);
                } else {
                    workerLogger.error({
                        message: `Non-retryable error processing payment with paymentId: ${paymentId}`,
                        error: result.message
                    });
                    paymentsFailed.inc({ payment_type: paymentData.payment_type });
                    await redisPublish("payment.updated", {
                        payment_id: paymentId,
                        status: 'failed',
                        error: result.message,
                        amount: payment?.amount,
                        currency: payment?.currency,
                        account_id: payment?.sender_id?.toString(),
                        payment_type: paymentType
                    });
                    channel.ack(msg);
                    return;
                }
            }

            workerLogger.info({
                message: `Successfully processed payment with paymentId: ${paymentId}`,
            });

            if (paymentType === 'TRANSFER') {
                // notify sender and receiver about the payment status
                const senderId = payment.sender_id.toString();
                const receiverId = payment.receiver_id.toString();

                const sseChannel = "payment.updated"

                const message = {
                    payment_id: paymentId,
                    status: 'completed',
                    amount: payment.amount,
                    currency: payment.currency,
                    payment_type: paymentType
                }

                await redisPublish(sseChannel, {
                    ...message,
                    account_id: senderId
                });

                await redisPublish(sseChannel, {
                    ...message,
                    account_id: receiverId
                });

                // send msg to mail queue for sending mail to sender and receiver
                const mailDataSender = {
                    payment_id: paymentId,
                    recipient_email: payment.sender_email,
                }
                await sendToMailQueue(channel, mailDataSender);
                const mailDataReceiver = {
                    payment_id: paymentId,
                    recipient_email: payment.receiver_email,
                }
                await sendToMailQueue(channel, mailDataReceiver);

            } else if (paymentType === 'DEPOSIT') {
                // notify sender about the payment status
                const senderId = payment.receiver_id.toString(); // for deposit, the receiver is the account that made the deposit
                const sseChannel = "payment.updated"

                const message = {
                    payment_id: paymentId,
                    status: 'completed',
                    amount: payment.amount,
                    currency: payment.currency,
                    notes: payment.notes,
                    payment_type: paymentType
                }

                await redisPublish(sseChannel, {
                    ...message,
                    account_id: senderId
                });

                // send msg to mail queue for sending mail to sender
                const mailData = {
                    payment_id: paymentId,
                    recipient_email: payment.receiver_email,
                }
                await sendToMailQueue(channel, mailData);
            }

            
            channel.ack(msg);

            paymentsSuccessful.inc({ payment_type: paymentData.payment_type });

        } catch (error) {

            if (attemptCount < MAX_RETRIES) {
                let retryQueue: string;
                if (attemptCount === 0) {
                    retryQueue = retryQueues[0];
                } else if (attemptCount === 1) {
                    retryQueue = retryQueues[1];
                } else {
                    retryQueue = retryQueues[2];
                }

                const delays = [
                    baseTTL, // 2 seconds for first retry
                    baseTTL * 2, // 4 seconds for second retry
                    baseTTL * 4, // 8 seconds for third retry
                ]
                const jitter = Math.floor(Math.random() * 1000);
                const delay = delays[attemptCount] + jitter;

                workerLogger.warn({
                    message: `Error processing payment. Retrying.`,
                    paymentId: paymentId,
                    retryQueue: retryQueue,
                    delay: delay,
                    error: (error as Error).message,
                    attemptCount: attemptCount + 1
                });

                channel.sendToQueue(
                    retryQueue,
                    msg.content,
                    {
                        persistent: true,
                        expiration: delay.toString(),
                        headers: {
                            'x-attempts': attemptCount + 1
                        },
                    }
                );
                await channel.waitForConfirms();
                channel.ack(msg);

                paymentsRetried.inc({ payment_type: paymentData.payment_type });
            } else {
                workerLogger.error({
                    message: `Max retries reached for payment with paymentId: ${paymentId}. Sending to deadletter queue.`,
                    error: (error as Error).message,
                    attemptCount: attemptCount + 1
                });
                channel.sendToQueue(
                    "payment_dlq",
                    msg.content,
                    {
                        persistent: true,
                    }
                );
                await channel.waitForConfirms();

                channel.ack(msg); // Acknowledge to remove from queue
                paymentsDeadLettered.inc({ payment_type: paymentData.payment_type });
                paymentsFailed.inc({ payment_type: paymentData.payment_type });
            }
        } finally {
            paymentsInProgress.dec({ payment_type: paymentType });
        }
    }
}, { noAck: false });