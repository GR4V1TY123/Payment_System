
import { publisherLogger } from '../utils/logger';
import { fetchAndPublishPayments } from '../utils/publisher';
import { connectRabbitMQ } from './rabbitmq';

const start = async () => {
    try {
        await connectRabbitMQ();
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