import { ConfirmChannel } from "amqplib";

export const sendToMailQueue = async (channel: ConfirmChannel,mailData: any) => {
    channel.sendToQueue(
        'mail_queue',
        Buffer.from(JSON.stringify(mailData)),
        { persistent: true } // Ensure the message is persisted to disk
    );

    await channel.waitForConfirms(); // Wait for the message to be confirmed by RabbitMQ
};