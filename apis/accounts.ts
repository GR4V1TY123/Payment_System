import fastify from "../app";
import { createAccount, getAccountInfo, getTransactionHistory } from "../controllers/account";
import { accountSchema } from "../schemas/bodySchemas";

// create account
fastify.post(
    '/accounts', 
    { schema: accountSchema }, 
    createAccount
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