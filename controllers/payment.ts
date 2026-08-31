import fastify from "../app";
import type { FastifyRequest, FastifyReply } from "fastify";
import { createPaymentQuery, getPaymentDetailsQuery } from "../utils/query";
import { processPayment } from "../messaging/paymentQueue";

const createPayment = async (
    request: FastifyRequest<{
    Body: {
        sender_id: string;
        receiver_id: string;
        amount: number;
        currency: string;
        notes?: string;
    };
}>,
    reply: FastifyReply
) => {

    const { sender_id, receiver_id, amount, currency, notes } = request.body;
    const { idempotency_key } = request.headers as { idempotency_key: string };

    request.log.info({
        message: `Received request to create payment from ${sender_id} to ${receiver_id} of amount ${amount} ${currency}`,
        body: request.body,
        headers: request.headers
    });

    try {
        const query = createPaymentQuery(sender_id, receiver_id, amount, currency, notes, idempotency_key);

        const result = await fastify.pg.query(query);

        if (result.rowCount === 0) {
            request.log.error({
                message: `Failed to create payment from ${sender_id} to ${receiver_id} of amount ${amount} ${currency}`,
                error: 'No rows affected'
            });
            reply.status(400).send({
                success: false,
                message: 'Error creating payment',
                error: 'No rows affected'
            });
            return;
        }

        // Send payment data to RabbitMQ for further processing
        request.log.info({
            message: `Successfully created payment from ${sender_id} to ${receiver_id} of amount ${amount} ${currency}. Sending to RabbitMQ for processing.`,
            rows: result.rows
        });
        await processPayment(result.rows[0]);

        request.log.info({
            message: `Payment from ${sender_id} to ${receiver_id} of amount ${amount} ${currency} sent to RabbitMQ for processing.`,
            paymentData: result.rows[0]
        });

        reply.status(200).send({
            success: true,
            rowCount: result.rowCount,
            rows: result.rows,
            message: 'Payment created successfully'
        });

    } catch (error) {
        request.log.error({
            message: `Error creating payment from ${sender_id} to ${receiver_id} of amount ${amount} ${currency}`,
            error: (error as Error).message
        });
        reply.status(500).send({
            success: false,
            message: 'Error creating payment',
            error: (error as Error).message
        });
    }
};

const getPaymentDetails = async (
    request: FastifyRequest<{
    Params: { payment_id: string }
}>,
    reply: FastifyReply
) => {

    request.log.info({
        message: `Received request to get payment details for payment_id: ${request.params.payment_id}`,
        params: request.params
    });

    try {
        const { payment_id } = request.params as { payment_id: string };
        const query = getPaymentDetailsQuery(payment_id);

        const result = await fastify.pg.query(query);

        if (result.rowCount === 0) {
            request.log.error({
                message: `Payment not found for payment_id: ${payment_id}`,
                error: 'No rows returned'
            });
            reply.status(400).send({
                success: false,
                message: 'Payment not found',
                error: 'No rows returned'
            });
            return;
        }

        request.log.info({
            message: `Successfully retrieved payment details for payment_id: ${payment_id}`,
            rows: result.rows
        });

        reply.status(200).send({
            success: true,
            message: 'Payment details retrieved successfully',
            rows: result.rows
        });
    } catch (error) {

        request.log.error({
            message: `Error retrieving payment details for payment_id: ${request.params.payment_id}`,
            error: (error as Error).message
        });

        reply.status(500).send({
            success: false,
            message: 'Error retrieving payment details',
            error: (error as Error).message
        });
    }
}

export {
    createPayment,
    getPaymentDetails
};