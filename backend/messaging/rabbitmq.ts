// Connect rabbitmq to the application
import amqp, { ConfirmChannel } from 'amqplib';
import { paymentQueueLogger } from '../utils/logger';

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';

let rabbitChannel: ConfirmChannel;

export async function connectRabbitMQ(queueName: string): Promise<ConfirmChannel> {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        rabbitChannel = await connection.createConfirmChannel();

        const queue = queueName;
        await rabbitChannel.assertQueue(queue, { durable: true });

        paymentQueueLogger.info({
            message: 'Connected to RabbitMQ',
        });
        return rabbitChannel;
    } catch (error) {
        paymentQueueLogger.error({
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