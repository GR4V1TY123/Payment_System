import { getRabbitChannel } from "../rabbitmq";

export const sendToMailQueue = async (mailData: any) => {
    const channel = getRabbitChannel();

    channel.sendToQueue(
        'mail_queue',
        Buffer.from(JSON.stringify(mailData)),
        { persistent: true } // Ensure the message is persisted to disk
    );

    await channel.waitForConfirms(); // Wait for the message to be confirmed by RabbitMQ
};