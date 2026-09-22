
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

const getPaymentDetailsWithNamesQuery = (paymentId: bigint) => {
    return {
        text: 'SELECT p.*, s.name AS sender_name, r.name AS receiver_name FROM payments p LEFT JOIN accounts s ON p.sender_id = s.account_id LEFT JOIN accounts r ON p.receiver_id = r.account_id WHERE p.payment_id = $1',
        values: [paymentId],
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

const createLedgerEntryQuery = (accountId: bigint, paymentId: bigint, amount: number, type: 'DEBIT' | 'CREDIT') => {
    return {
        text: 'INSERT INTO ledger_entries (account_id, payment_id, amount, type) VALUES ($1, $2, $3, $4) RETURNING *',
        values: [accountId, paymentId, amount, type]
    }
}

export {
    createPaymentQuery,
    getPaymentDetailsQuery,
    getPaymentByIdQuery,
    updatePaymentStatusQuery,
    createLedgerEntryQuery,
    getPaymentDetailsWithNamesQuery
}