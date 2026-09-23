// Queue operations for payment processing
import { ConfirmChannel } from "amqplib";
import connection from "../rabbitmq";

const channel: ConfirmChannel = await connection.createConfirmChannel();

await channel.assertQueue("payment_queue", {
    durable: true
});

export const publishToQueue = async (paymentData: any) => {
    channel.sendToQueue(
        'payment_queue',
        Buffer.from(JSON.stringify(paymentData)),
        { persistent: true } // Ensure the message is persisted to disk
    );

    await channel.waitForConfirms(); // Wait for the message to be confirmed by RabbitMQ
};