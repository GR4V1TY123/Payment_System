import amqp, { ChannelModel } from 'amqplib';
import { workerLogger } from '../utils/logger';

const RABBITMQ_URL =
    process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';

let connection: ChannelModel;

try {
    connection = await amqp.connect(RABBITMQ_URL);

    workerLogger.info({
        message: 'Connected to RabbitMQ successfully'
    });
} catch (error) {
    workerLogger.error({
        message: 'Failed to connect to RabbitMQ',
        error: (error as Error).message
    });

    process.exit(1);
}

export default connection;