import fastify from "../app";
import { createAccount, depositPayment, getAccountInfo, getTransactionHistory } from "../controllers/account";
import { accountSchema, paymentSchema } from "../schemas/bodySchemas";

// create account
fastify.post(
    '/accounts',
    { schema: accountSchema },
    createAccount
);

// deposit payment
fastify.post(
    '/accounts/:account_id/deposit',
    { schema: paymentSchema },
    depositPayment
);

// view account details
fastify.get(
    '/accounts/:account_id',
    getAccountInfo
);

// view transaction history for a account
fastify.get(
    '/accounts/:account_id/ledger',
    getTransactionHistory
);