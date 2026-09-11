
import { fetchAndPublishPayments } from '../utils/publisher';
import { connectRabbitMQ } from './rabbitmq';

const start = async () => {
    try {
        await connectRabbitMQ();
        await fetchAndPublishPayments();
    } catch (error) {
        console.error({
            message: 'Error in publisher',
            error: (error as Error).message
        });
        process.exit(1);
    }
}

start(); // Start the publisher to fetch and publish payments from the outbox table