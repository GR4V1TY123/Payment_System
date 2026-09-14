
import { buildFastify } from '../app';
import { publisherLogger } from '../utils/logger';
import { fetchAndPublishPayments } from '../utils/publisher';
import { connectRabbitMQ } from './rabbitmq';
import client from 'prom-client';

const publisherServer = buildFastify();
const register = client.register;

publisherServer.get('/health', async (request, reply) => {
    reply.status(200).send({
        success: true,
        message: 'Publisher is healthy'
    });
})

publisherServer.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
})

const start = async () => {
    try {
        await connectRabbitMQ();

        const port = Number(process.env.PUBLISHER_PORT ?? 4000);
        await publisherServer.listen({ 
            port, 
            host: '0.0.0.0' 
        });

        await fetchAndPublishPayments();
    } catch (error) {
        publisherLogger.error({
            message: 'Error starting the publisher',
            error: (error as Error).message
        });
        process.exit(1);
    }
}

start(); // Start the publisher to fetch and publish payments from the outbox table