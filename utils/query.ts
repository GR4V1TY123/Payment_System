const getAccountInfoQuery = (accountId: string) => {
    return {
        text: 'SELECT * FROM accounts WHERE account_id = $1',
        values: [accountId],
    };
}

const createPaymentQuery = (sender_id: string, receiver_id: string, amount: number, currency: string, notes?: string, idempotency_key?: string) => {
    return {
        text: 'INSERT INTO payments (sender_id, receiver_id, amount, currency, notes, idempotency_key) VALUES ($1, $2, $3, $4, $5, $6) RETURNING payment_id',
        values: [sender_id, receiver_id, amount, currency, notes, idempotency_key],
    };
}

const getPaymentDetailsQuery = (paymentId: string) => {
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

export {
    getAccountInfoQuery,
    createPaymentQuery,
    getPaymentDetailsQuery,
    getTransactionHistoryQuery,
    createAccountQuery
}