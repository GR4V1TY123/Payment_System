// worker for processing payments from RabbitMQ queue
import amqp from 'amqplib';
import { handlePayment } from "../utils/handlePayments";

const connection = await amqp.connect(
    process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'
).then(conn => {
    console.log({
        message: 'Connected to RabbitMQ',
        url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'
    });
    return conn;
}).catch(err => {
    console.log({
        message: 'Failed to connect to RabbitMQ',
        error: err
    });
    process.exit(1);
})

const queue = 'payment_queue';

const channel = await connection.createChannel();
await channel.assertQueue(queue, {
    durable: true
});

channel.consume(queue, async (msg) => {
    if (msg) {

        console.log(`Received message from RabbitMQ queue: ${msg}`);

        try {
            const paymentData = JSON.parse(msg.content.toString());
            const paymentId = paymentData.payment_id;

            // Process the payment data
            console.log({
                message: `Processing payment data from RabbitMQ queue`,
                paymentId: paymentId
            });
            const result = await handlePayment(paymentId);

            // Acknowledge the message after processing
            if (!result.success) {
                throw new Error(`Failed to process payment: ${result.message}`);
            }

            console.log({
                message: `Successfully processed payment data from RabbitMQ queue`,
                paymentId: paymentId,
            });

            channel.ack(msg);

        } catch (error) {
            console.log({
                message: `Error processing payment from RabbitMQ queue`,
                error: (error as Error).message
            });
            channel.nack(msg, false, true); // requeue the message for retry
        }
    }
}, { noAck: false });