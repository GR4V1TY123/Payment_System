import { FastifyReply, FastifyRequest } from "fastify";
import { runQuery } from "../utils/query";
import { createAccountQuery, getAccountInfoQuery, getTransactionHistoryQuery } from "../query/accountQueries";
import { createPaymentQuery } from "../query/paymentQueries";
import { pool } from "../messaging/db";
import { createOutboxEntryQuery } from "../query/outboxQueries";

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

    request.log.info({
        message: `Received request to create account for ${name} with email ${email}`,
        body: request.body
    });

    try {
        const query = createAccountQuery(name, email, currency);

        const result = await runQuery(query);

        request.log.info({
            message: `Successfully created account for ${name} with email ${email}`,
            rowCount: result.rowCount,
        });

        reply.status(200).send({
            success: true,
            rowCount: result.rowCount,
            rows: result.rows,
            message: 'Account created successfully'
        });

    } catch (error) {
        request.log.error({
            message: `Error creating account for ${name} with email ${email}`,
            error: (error as Error).message
        });
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

    request.log.info({
        message: `Received request to get account info for account_id: ${account_id}`,
        params: request.params
    });

    try {
        const query = getAccountInfoQuery(BigInt(account_id));
        const result = await runQuery(query);

        request.log.info({
            message: `Successfully retrieved account info for account_id: ${account_id}`,
            rowCount: result.rowCount,
        });

        reply.status(200).send({
            success: true,
            message: 'Account details retrieved successfully',
            rows: result.rows
        });
    } catch (error) {
        request.log.error({
            message: `Error retrieving account info for account_id: ${account_id}`,
            error: (error as Error).message
        });
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

    request.log.info({
        message: `Received request to get transaction history for account_id: ${account_id}`,
        params: request.params
    });

    try {
        const query = getTransactionHistoryQuery(account_id);
        const result = await runQuery(query);

        request.log.info({
            message: `Successfully retrieved transaction history for account_id: ${account_id}`,
            rowCount: result.rowCount,
        });

        reply.status(200).send({
            success: true,
            message: 'Transaction history retrieved successfully',
            rows: result.rows
        });
    } catch (error) {
        request.log.error({
            message: `Error retrieving transaction history for account_id: ${account_id}`,
            error: (error as Error).message
        });
        reply.status(500).send({
            success: false,
            message: 'Error retrieving transaction history',
            error: (error as Error).message
        });
    }
}

const depositPayment = async (
    request: FastifyRequest<{
        Params: {
            account_id: string;
        };
        Body: {
            amount: number;
            currency: string;
            notes?: string;
        };
    }>,
    reply: FastifyReply
) => {
    const { account_id } = request.params as { account_id: string };
    const { amount, currency, notes } = request.body;
    const { idempotency_key } = request.headers as { idempotency_key: string };
    const payment_type = 'DEPOSIT'; // Set payment type as 'deposit'

    request.log.info({
        message: `Received request to deposit payment to account_id: ${account_id} of amount ${amount} ${currency}`,
        body: request.body
    });

    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        const PaymentQuery = createPaymentQuery(null, BigInt(account_id), amount, currency, payment_type, notes, idempotency_key);
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
            message: `Successfully created payment record to deposit amount ${amount} ${currency}.`,
            rows: result.rows
        });

        // await processPayment(result.rows[0]);

        reply.status(202).send({
            success: true,
            rowCount: result.rowCount,
            message: 'Payment accepted for processing'
        });

    } catch (error) {
        request.log.error({
            message: `Error depositing payment to account_id: ${account_id} of amount ${amount} ${currency}`,
            error: (error as Error).message
        });
        reply.status(500).send({
            success: false,
            message: 'Error depositing payment',
            error: (error as Error).message
        });
    }
}

export {
    createAccount,
    getAccountInfo,
    getTransactionHistory,
    depositPayment
};