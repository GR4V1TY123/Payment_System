// Connect rabbitmq to the application
import amqp, { ConfirmChannel } from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';

let rabbitChannel: ConfirmChannel;

export async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        rabbitChannel = await connection.createConfirmChannel();

        const queue = 'payment_queue';
        await rabbitChannel.assertQueue(queue, { durable: true });

        console.log({
            message: `Connected to RabbitMQ and asserted queue: ${queue}`,
        });
        return rabbitChannel;
    } catch (error) {
        console.log({
            message: 'Failed to connect to RabbitMQ',
            error: (error as Error).message
        });
        throw error;
    }
}

export function getRabbitChannel(): ConfirmChannel {
    if (!rabbitChannel) {
        throw new Error('RabbitMQ channel is not initialized. Call connectRabbitMQ() first.');
    }
    return rabbitChannel;
}