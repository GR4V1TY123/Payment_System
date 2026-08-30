import fastify from "../app";
import type { FastifyRequest, FastifyReply } from "fastify";
import { createPaymentQuery, getPaymentDetailsQuery } from "../utils/query";

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
    try {
        const query = createPaymentQuery(sender_id, receiver_id, amount, currency, notes);

        const result = await fastify.pg.query(query);

        if (result.rowCount === 0) {
            reply.status(400).send({
                success: false,
                message: 'Error creating payment',
                error: 'No rows affected'
            });
            return;
        }

        reply.status(200).send({
            success: true,
            rowCount: result.rowCount,
            rows: result.rows,
            message: 'Payment created successfully'
        });

    } catch (error) {
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
    try {
        const { payment_id } = request.params as { payment_id: string };
        const query = getPaymentDetailsQuery(payment_id);

        const result = await fastify.pg.query(query);

        if (result.rowCount === 0) {
            reply.status(400).send({
                success: false,
                message: 'Payment not found',
                error: 'No rows returned'
            });
            return;
        }
        reply.status(200).send({
            success: true,
            message: 'Payment details retrieved successfully',
            rows: result.rows
        });
    } catch (error) {
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