// worker for processing payments from RabbitMQ queue
import fastify from "../app";
import amqp from 'amqplib';

const connection = await amqp.connect(
    process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'
);

const queue = 'payment_queue';

const channel = await connection.createChannel();
await channel.assertQueue(queue, {
    durable: true
});

channel.consume(queue, (msg) => {
    if (msg) {
        const paymentData = JSON.parse(msg.content.toString());
        // Process the payment data
        fastify.log.info({
            message: `Processing payment data from RabbitMQ queue`,
            paymentData
        });


        setTimeout(() => {
            fastify.log.info(`Dummy Payment data processed and acknowledged from RabbitMQ queue`);
            channel.ack(msg!);
        }, 9000);
    }
}, { noAck: false });