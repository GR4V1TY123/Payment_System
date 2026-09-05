import { pool } from "../messaging/db";

// query bolierplate
const runQuery = async (query:
    { text: string; values?: any[] }
) => {

    try {
        return await pool.query(query);
    } catch (error) {
        console.log(
            { err: error },
            'Database query failed'
        );
        throw error;
    }
};

const getAccountInfoQuery = (accountId: bigint) => {
    return {
        text: 'SELECT * FROM accounts WHERE account_id = $1',
        values: [accountId],
    };
}

const createPaymentQuery = (sender_id: bigint | null, receiver_id: bigint | null, amount: number, currency: string, payment_type: string, notes?: string, idempotency_key?: string) => {
    return {
        text: 'INSERT INTO payments (sender_id, receiver_id, amount, currency, payment_type, notes, idempotency_key) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING payment_id',
        values: [sender_id, receiver_id, amount, currency, payment_type, notes, idempotency_key],
    };
}

const getPaymentDetailsQuery = (paymentId: bigint) => {
    return {
        text: 'SELECT * FROM payments WHERE payment_id = $1',
        values: [paymentId],
    };
}

const getTransactionHistoryQuery = (accountId: string) => {
    return {
        text: 'SELECT * FROM payments WHERE sender_id = $1 OR receiver_id = $1 ORDER BY created_at DESC',
        values: [accountId],
    };
}

const createAccountQuery = (name: string, email: string, currency: string | undefined) => {
    if (!currency) {
        currency = 'INR'; // default currency
    }
    return {
        text: 'INSERT INTO accounts (name, email, currency) VALUES ($1, $2, $3) RETURNING account_id',
        values: [name, email, currency],
    };
}

const getPaymentByIdQuery = (paymentId: bigint) => {
    return {
        text: 'SELECT * FROM payments WHERE payment_id = $1',
        values: [paymentId],
    };
}

const updatePaymentStatusQuery = (paymentId: bigint, status: string) => {
    return {
        text: 'UPDATE payments SET status = $1 WHERE payment_id = $2 RETURNING *',
        values: [status, paymentId],
    }
}

const checkAccountExistQuery = (accountId: bigint) => {
    return {
        text: 'SELECT EXISTS( SELECT 1 FROM accounts WHERE account_id = $1 )',
        values: [accountId]
    }
}

const checkAccountBalanceQuery = (accountId: bigint) => {
    return {
        text: 'SELECT balance FROM accounts WHERE account_id = $1',
        values: [accountId]
    }
}

const creditAccountBalanceQuery = (accountId: bigint, amount: number) => {
    return {
        text: 'UPDATE accounts SET balance = balance + $1 WHERE account_id = $2 RETURNING *',
        values: [amount, accountId]
    }
}

const debitAccountBalanceQuery = (accountId: bigint, amount: number) => {
    return {
        text: 'UPDATE accounts SET balance = balance - $1 WHERE account_id = $2 RETURNING *',
        values: [amount, accountId]
    }
}

const createLedgerEntryQuery = (accountId: bigint, paymentId: bigint, amount: number, type: 'DEBIT' | 'CREDIT') => {
    return {
        text: 'INSERT INTO ledger_entries (account_id, payment_id, amount, type) VALUES ($1, $2, $3, $4) RETURNING *',
        values: [accountId, paymentId, amount, type]
    }
}

export {
    runQuery,
    getAccountInfoQuery,
    createPaymentQuery,
    getPaymentDetailsQuery,
    getTransactionHistoryQuery,
    createAccountQuery,
    getPaymentByIdQuery,
    updatePaymentStatusQuery,
    checkAccountExistQuery,
    checkAccountBalanceQuery,
    creditAccountBalanceQuery,
    debitAccountBalanceQuery,
    createLedgerEntryQuery
}