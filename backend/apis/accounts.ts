import { createAccount, depositPayment, getAccountEvents, getAccountInfo, getPaymentHistory, getTransactionHistory, login, logout } from "../controllers/account";
import { accountSchema, paymentSchema } from "../schemas/bodySchemas";
import type { FastifyInstance } from "fastify";

export default async function accountRoutes(
    fastify: FastifyInstance,
) {
    // create account
    fastify.post(
        '/accounts',
        {
            schema: accountSchema
        },
        createAccount
    );

     // logout account
    fastify.post(
        '/accounts/logout',
        {
            onRequest: [fastify.authenticateToken],
        },
        logout
    );

    // login account
    fastify.post(
        '/accounts/login',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 6 }
                    }
                }
            }
        },
        login
    );

    // Get server side events for payment updates
    fastify.get(
        '/accounts/events',
        {
            onRequest: [fastify.authenticateToken],
        },
        getAccountEvents
    );

    // deposit payment
    fastify.post<{
        Params: {
            account_id: string;
        };
        Body: {
            amount: number;
            currency: string;
            notes?: string;
        };
    }>(
        '/accounts/:account_id/deposit',
        { 
            onRequest: [fastify.authenticateToken],
            schema: paymentSchema
        },
        depositPayment
    );

    // view account details
    fastify.get<{
        Params: {
            account_id: string;
        };
    }>(
        '/accounts/:account_id',
        {
            onRequest: [fastify.authenticateToken],
        },
        getAccountInfo
    );

    // view transaction history for a account
    fastify.get<{
        Params: {
            account_id: string;
        };
    }>(
        '/accounts/:account_id/ledger',
        {
            onRequest: [fastify.authenticateToken],
        },
        getTransactionHistory
    );

    // get payment history for a account
    fastify.get<{
        Params: {
            account_id: string;
        };
    }>(
        '/accounts/:account_id/payments',
        {
            onRequest: [fastify.authenticateToken],
        },
        getPaymentHistory
    );
}