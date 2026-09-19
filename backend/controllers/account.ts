import { FastifyReply, FastifyRequest } from "fastify";
import { runQuery } from "../utils/query";
import { createAccountQuery, getAccountInfoQuery, getPaymentHistoryQuery, getTransactionHistoryQuery } from "../query/accountQueries";
import { createPaymentQuery } from "../query/paymentQueries";
import { pool } from "../messaging/db";
import { createOutboxEntryQuery } from "../query/outboxQueries";
import { apiLogger } from "../utils/logger";
import * as argon2 from "argon2";

const createAccount = async (
    request: FastifyRequest<{
        Body: {
            name: string;
            email: string;
            currency?: string;
            password: string;
        };
    }>,
    reply: FastifyReply
) => {
    const { name, email, password, currency } = request.body;

    apiLogger.info({
        message: `Received request to create account for ${name} with email ${email}`,
    });

    try {
        const expirationTime = process.env.JWT_EXPIRATION_TIME || '1h';

        const password_hash = await argon2.hash(password);

        const query = createAccountQuery(name, email, currency, password_hash);
        const result = await runQuery(query);

        const account = result.rows[0];

        const token = await reply.jwtSign({
            sub: account.account_id.toString(),
            name: account.name,
            email: account.email,
        }, { expiresIn: expirationTime });

        apiLogger.info({
            message: `Successfully created account for ${name} with email ${email}`,
            rowCount: result.rowCount,
        });

        reply.setCookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        }).status(201).send({
            success: true,
            account: account,
            message: 'Account created successfully'
        });

    } catch (error) {
        apiLogger.error({
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
    const userId = request.user.sub

    if (!userId || userId !== account_id) {
        apiLogger.warn({
            message: `Unauthorized account info request for account_id: ${account_id} by user_id: ${userId}`,
            params: request.params,
            headers: request.headers
        });
        return reply.status(403).send({
            success: false,
            message: 'You are not authorized to view this account\'s details'
        });
    }

    apiLogger.info({
        message: `Received request to get account info for account_id: ${account_id}`,
        params: request.params
    });

    try {
        const query = getAccountInfoQuery(BigInt(account_id));
        const result = await runQuery(query);

        apiLogger.info({
            message: `Successfully retrieved account info for account_id: ${account_id}`,
            rowCount: result.rowCount,
        });

        reply.status(200).send({
            success: true,
            message: 'Account details retrieved successfully',
            rows: result.rows
        });
    } catch (error) {
        apiLogger.error({
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
    const userId = request.user.sub

    if (!userId || userId !== account_id) {
        apiLogger.warn({
            message: `Unauthorized transaction history request for account_id: ${account_id} by user_id: ${userId}`,
            params: request.params,
            headers: request.headers
        });
        return reply.status(403).send({
            success: false,
            message: 'You are not authorized to view this account\'s transaction history'
        });
    }

    apiLogger.info({
        message: `Received request to get transaction history for account_id: ${account_id}`,
        params: request.params
    });

    try {
        const query = getTransactionHistoryQuery(account_id);
        const result = await runQuery(query);

        apiLogger.info({
            message: `Successfully retrieved transaction history for account_id: ${account_id}`,
            rowCount: result.rowCount,
        });

        reply.status(200).send({
            success: true,
            message: 'Transaction history retrieved successfully',
            rows: result.rows
        });
    } catch (error) {
        apiLogger.error({
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

const getPaymentHistory = async (
    request: FastifyRequest<{
        Params: {
            account_id: string;
        };
    }>,
    reply: FastifyReply
) => {
    const { account_id } = request.params as { account_id: string };
    const userId = request.user.sub

    if (!userId || userId !== account_id) {
        apiLogger.warn({
            message: `Unauthorized attempt to access payment history for account_id: ${account_id} by user_id: ${userId}`,
            params: request.params,
            headers: request.headers
        });
        return reply.status(403).send({
            success: false,
            message: 'You are not authorized to view payment history for this account'
        });
    }

    apiLogger.info({
        message: `Received request to get payment history for account_id: ${account_id}`,
        params: request.params
    });

    try {
        const query = getPaymentHistoryQuery(account_id);
        const result = await runQuery(query);

        apiLogger.info({
            message: `Successfully retrieved payment history for account_id: ${account_id}`,
            rowCount: result.rowCount,
        });

        reply.status(200).send({
            success: true,
            message: 'Payment history retrieved successfully',
            rows: result.rows
        });
    } catch (error) {
        apiLogger.error({
            message: `Error retrieving payment history for account_id: ${account_id}`,
            error: (error as Error).message
        });
        reply.status(500).send({
            success: false,
            message: 'Error retrieving payment history',
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

    const userId = request.user.sub

    if (!userId || userId !== account_id) {
        apiLogger.warn({
            message: `Unauthorized deposit attempt to account_id: ${account_id} by user_id: ${userId}`,
            params: request.params,
            headers: request.headers
        });
        return reply.status(403).send({
            success: false,
            message: 'You are not authorized to deposit to this account'
        });
    }

    apiLogger.info({
        message: `Received request to deposit payment to account_id: ${account_id} of amount ${amount} ${currency}`,
        params: request.params,
        body: request.body,
        headers: request.headers
    });

    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        const PaymentQuery = createPaymentQuery(null, BigInt(account_id), amount, currency, payment_type, notes, idempotency_key);
        const result = await client.query(PaymentQuery);

        const payment = result.rows[0];
        const { payment_id } = payment;
        const payload = {
            payment_id: payment_id.toString(),
            payment_type: payment_type,
        }

        // make outbox record in outbox table
        const OutboxEntryQuery = createOutboxEntryQuery(BigInt(payment_id), 'PAYMENT_CREATED', payload);
        await client.query(OutboxEntryQuery);

        await client.query("COMMIT");

        // Send payment data to RabbitMQ for further processing
        apiLogger.info({
            message: `Successfully deposited payment to account_id: ${account_id} of amount ${amount} ${currency}.`,
            rowCount: result.rowCount,
        });

        // await processPayment(result.rows[0]);

        reply.status(202).send({
            success: true,
            rowCount: result.rowCount,
            message: 'Payment accepted for processing'
        });

    } catch (error) {
        await client.query("ROLLBACK");
        apiLogger.error({
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

const logout = async (request: FastifyRequest, reply: FastifyReply) => {
    apiLogger.info({
        message: `Received request to logout user with account_id: ${request.user.sub}`,
    });
    reply.clearCookie('access_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    }).status(200).send({
        success: true,
        message: 'Logged out successfully'
    });
}

const login = async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = request.body as { email: string; password: string };

    apiLogger.info({
        message: `Received login request for email: ${email}`,
    });

    try {
        const query = `SELECT account_id, name, email, password_hash FROM accounts WHERE email = $1`;
        const result = await runQuery({ text: query, values: [email] });

        if (result.rowCount === 0) {
            apiLogger.warn({
                message: `Login failed for email: ${email} - account not found`,
            });
            return reply.status(401).send({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const account = result.rows[0];
        const isPasswordValid = await argon2.verify(account.password_hash, password);

        if (!isPasswordValid) {
            apiLogger.warn({
                message: `Login failed for email: ${email} - invalid password`,
            });
            return reply.status(401).send({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const expirationTime = process.env.JWT_EXPIRATION_TIME || '1h';
        const token = await reply.jwtSign({
            sub: account.account_id.toString(),
            name: account.name,
            email: account.email,
        }, { expiresIn: expirationTime });

        apiLogger.info({
            message: `Login successful for email: ${email}`,
        });

        reply.setCookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        }).status(200).send({
            success: true,
            message: 'Login successful',
            account: {
                account_id: account.account_id,
                name: account.name,
                email: account.email
            }
        });
    } catch (error) {
        apiLogger.error({
            message: `Error during login for email: ${email}`,
            error: (error as Error).message
        });
        reply.status(500).send({
            success: false,
            message: 'Error during login',
            error: (error as Error).message
        });
    }
}

export {
    createAccount,
    getAccountInfo,
    getTransactionHistory,
    depositPayment,
    getPaymentHistory,
    logout,
    login
};