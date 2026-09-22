// Queue operations for payment processing
import { getRabbitChannel } from "../rabbitmq";

export const publishToQueue = async (paymentData: any) => {
    const channel = getRabbitChannel();

    channel.sendToQueue(
        'payment_queue',
        Buffer.from(JSON.stringify(paymentData)),
        { persistent: true } // Ensure the message is persisted to disk
    );

    await channel.waitForConfirms(); // Wait for the message to be confirmed by RabbitMQ
};