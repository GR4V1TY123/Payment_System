// Connect rabbitmq to the application
import amqp, { Channel } from 'amqplib';
import fastify from '../app';

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';

let rabbitChannel : Channel;

export async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        rabbitChannel = await connection.createChannel();

        const queue = 'payment_queue';
        await rabbitChannel.assertQueue(queue, { durable: true });

        fastify.log.info({
            message: `Connected to RabbitMQ and asserted queue: ${queue}`,
            url: RABBITMQ_URL
        });
        return rabbitChannel;
    } catch (error) {
        fastify.log.error({
            message: 'Failed to connect to RabbitMQ',
            error: (error as Error).message
        });
        throw error;
    }
}

export function getRabbitChannel(): Channel {
    if (!rabbitChannel) {
        throw new Error('RabbitMQ channel is not initialized. Call connectRabbitMQ() first.');
    }
    fastify.log.info({
        message: 'RabbitMQ channel retrieved successfully'
    });
    return rabbitChannel;
}