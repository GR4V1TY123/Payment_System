import type { FastifyRequest, FastifyReply } from "fastify";
import { runQuery } from "../utils/query";
import { createPaymentQuery, getPaymentDetailsQuery } from "../query/paymentQueries";
import { pool } from "../messaging/db";
import { createOutboxEntryQuery } from "../query/outboxQueries";

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
    const payment_type = "TRANSFER"; // Set payment type as 'transfer'

    request.log.info({
        message: `Received request to create payment from ${sender_id} to ${receiver_id} of amount ${amount} ${currency}`,
        body: request.body,
    });

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // make payment record in payments table
        const PaymentQuery = createPaymentQuery(BigInt(sender_id), BigInt(receiver_id), amount, currency, payment_type, notes, idempotency_key);
        const result = await client.query(PaymentQuery);

        const payment = result.rows[0];
        const { payment_id } = payment;
        const payload = {
            payment_id: payment_id.toString()
        }

        // make outbox record in outbox table
        const OutboxEntryQuery = createOutboxEntryQuery(BigInt(payment_id), 'PAYMENT_CREATED', payload);
        await client.query(OutboxEntryQuery);

        await client.query("COMMIT");

        // Send payment data to RabbitMQ for further processing
        request.log.info({
            message: `Successfully created payment record from ${sender_id} to ${receiver_id} of amount ${amount} ${currency}.`,
            rowCount: result.rowCount,
        });

        reply.status(202).send({
            success: true,
            rowCount: result.rowCount,
            payment_id: payment_id,
            message: 'Payment accepted for processing'
        });

    } catch (error) {
        await client.query("ROLLBACK");
        request.log.error({
            message: `Error creating payment from ${sender_id} to ${receiver_id} of amount ${amount} ${currency}`,
            error: (error as Error).message
        });
        reply.status(500).send({
            success: false,
            message: 'Error creating payment',
            error: (error as Error).message
        });
    } finally {
        // Release the client back to the pool
        client.release();
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
        const query = getPaymentDetailsQuery(BigInt(payment_id));

        const result = await runQuery(query);

        request.log.info({
            message: `Successfully retrieved payment details for payment_id: ${payment_id}`,
            rowCount: result.rowCount,
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