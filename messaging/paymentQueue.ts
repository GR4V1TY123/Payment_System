// Queue operations for payment processing
import { getRabbitChannel } from "./rabbitmq";

export const processPayment = async (paymentData: any) => {
    const channel = getRabbitChannel();

    channel.sendToQueue(
        'payment_queue',
        Buffer.from(JSON.stringify(paymentData))
    );

    console.log({
        message: `Payment data sent to RabbitMQ queue for processing`,
        paymentData
    });
};