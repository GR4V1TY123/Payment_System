import { buildFastify } from "../../app";
import client from 'prom-client';
import { mailLogger } from "../../utils/logger";
import amqp from 'amqplib';
import { handleMail } from "./handleMail";
import connection from "../rabbitmq";
import nodemailerPlugin from '../../plugins/nodemailer'

const MAX_RETRIES = 3;

const mailServer = buildFastify();
const register = client.register;

mailServer.register(nodemailerPlugin, {
    transport: {
        host: process.env.SMTP_HOST ?? 'smtp.example.com',
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_FROM_EMAIL,
            pass: process.env.SMTP_PASS
        }
    }
});

mailServer.get('/health', async (request, reply) => {
    reply.status(200).send({
        success: true,
        message: 'mail worker is healthy'
    });
})

mailServer.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
})

await mailServer.listen({
    port: Number(process.env.MAIL_WORKER_PORT ?? 6000),
    host: '0.0.0.0'
});

const queue = 'mail_queue';
const baseTTL = 2000; // Base TTL for retry queues in milliseconds
const retryQueues = ["mail_retry_queue_1", "mail_retry_queue_2", "mail_retry_queue_3"];

const channel = await connection.createConfirmChannel();
await channel.assertQueue(queue, {
    durable: true
});

channel.prefetch(1); // Process one message at a time


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
await channel.assertQueue("mail_dlq", {
    durable: true,
});

channel.consume(queue, async (msg) => {
    if (!msg) {
        mailLogger.error({
            message: 'Received null message from queue'
        });
        return;
    }

    mailLogger.info({
        message: 'Received message from queue',
        content: msg.content.toString(),
    });

    const attemptCount = Number(msg.properties.headers?.['x-attempts'] ?? 0);

    const mailData = JSON.parse(msg.content.toString());
    const { payment_id, recipient_email } = mailData;

    try {
        const result = await handleMail(payment_id, recipient_email);

        if (!result.success) {
            if (!result.retryable) {
                // If the error is not retryable, delete the message and log the error
                mailLogger.error({
                    message: 'Non-retryable error occurred while processing mail',
                    payment_id,
                    recipient_email,
                    error: result.error
                });
                channel.ack(msg);
                return;
            }
            throw new Error(result.error);
        }

        mailLogger.info({
            message: 'Mail processed successfully',
            payment_id,
            recipient_email,
        });

        channel.ack(msg);

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

            mailLogger.warn({
                message: `Error processing mail. Retrying.`,
                payment_id,
                recipient_email,
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
        } else {
            mailLogger.error({
                message: `Max retries reached for mail for payment id: ${payment_id}. Sending to deadletter queue.`,
                error: (error as Error).message,
                attemptCount: attemptCount + 1
            });
            channel.sendToQueue(
                "mail_dlq",
                msg.content,
                {
                    persistent: true,
                }
            );

            await channel.waitForConfirms();
            channel.ack(msg);
        }
    } finally {
    }
})

export { mailServer };