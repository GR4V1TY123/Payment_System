// worker for processing payments from RabbitMQ queue
import amqp from 'amqplib';
import { handlePayment } from "../utils/handlePayments";

const MAX_RETRIES = 3;

const connection = await amqp.connect(
    process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'
).then(conn => {
    console.log({
        message: 'Connected to RabbitMQ',
        url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'
    });
    return conn;
}).catch(err => {
    console.log({
        message: 'Failed to connect to RabbitMQ',
        error: err
    });
    process.exit(1);
})

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

channel.consume(queue, async (msg) => {
    if (msg) {

        console.log(`Received message from RabbitMQ queue: ${msg}`);

        const paymentData = JSON.parse(msg.content.toString());
        const paymentId = paymentData.payment_id;

        const attemptCount = Number(msg.properties.headers?.['x-attempts'] ?? 0);

        try {
            const result = await handlePayment(paymentId);

            // Acknowledge the message after processing
            if (!result.success) {
                if (!result.retryable) {
                    console.log({
                        message: `Non-retryable error occurred while processing paymentId: ${paymentId}. Discarding message.`,
                        error: result.message
                    });
                    channel.ack(msg);
                    return;
                }
                throw new Error(`Failed to process payment: ${result.message}`);
            }

            console.log({
                message: `Successfully processed payment data from RabbitMQ queue`,
                paymentId: paymentId,
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

                console.log({
                    message: `Retrying payment processing for paymentId: ${paymentId} in queue: ${retryQueue}`,
                });

                const delays = [
                    baseTTL, // 2 seconds for first retry
                    baseTTL * 2, // 4 seconds for second retry
                    baseTTL * 4, // 8 seconds for third retry
                ]
                const jitter = Math.floor(Math.random() * 1000);
                const delay = delays[attemptCount] + jitter;

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
                console.log({
                    message: `Max retries reached for paymentId: ${paymentId}. Discarding message.`,
                    attemptCount: attemptCount
                });
                channel.ack(msg); // Acknowledge to remove from queue
            }
        }
    }
}, { noAck: false });