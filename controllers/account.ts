import { FastifyReply, FastifyRequest } from "fastify";
import { createAccountQuery, getAccountInfoQuery, getTransactionHistoryQuery } from "../utils/query";
import fastify from "../app";

const createAccount = async (
    request: FastifyRequest<{
        Body: {
            name: string;
            email: string;
            currency?: string;
        };
    }>,
    reply: FastifyReply
) => {
    const { name, email, currency } = request.body;

    try {
        const query = createAccountQuery(name, email, currency);

        const result = await fastify.pg.query(query);

        if (result.rowCount === 0) {
            reply.status(400).send({
                success: false,
                message: 'Error creating account',
                error: 'No rows affected'
            });
            return;
        }

        reply.status(200).send({
            success: true,
            rowCount: result.rowCount,
            rows: result.rows,
            message: 'Account created successfully'
        });

    } catch (error) {
        reply.status(500).send({
            success: false,
            message: 'Error creating account',
            error: (error as Error).message
        });
    }
}

const getAccountInfo = async (
    request: FastifyRequest<{
        Params: {
            account_id: string;
        };
    }>, reply: FastifyReply
) => {
    const { account_id } = request.params as { account_id: string };
    try {
        const query = getAccountInfoQuery(account_id);
        const result = await fastify.pg.query(query);

        if (result.rowCount === 0) {
            reply.status(400).send({
                success: false,
                message: 'Account not found',
                error: 'No rows returned'
            });
            return;
        }

        reply.status(200).send({
            success: true,
            message: 'Account details retrieved successfully',
            rows: result.rows
        });
    } catch (error) {
        reply.status(500).send({
            success: false,
            message: 'Error retrieving account details',
            error: (error as Error).message
        });
    }
}

const getTransactionHistory = async (
    request: FastifyRequest<{
        Params: {
            account_id: string;
        };
    }>,
    reply: FastifyReply
) => {
    const { account_id } = request.params as { account_id: string };
    try {
        const query = getTransactionHistoryQuery(account_id);
        const result = await fastify.pg.query(query);

        if (result.rowCount === 0) {
            reply.status(400).send({
                success: false,
                message: 'Transaction history not found',
                error: 'No rows returned'
            });
            return;
        }

        reply.status(200).send({
            success: true,
            message: 'Transaction history retrieved successfully',
            rows: result.rows
        });
    } catch (error) {
        reply.status(500).send({
            success: false,
            message: 'Error retrieving transaction history',
            error: (error as Error).message
        });
    }
}

export {
    createAccount,
    getAccountInfo,
    getTransactionHistory
};