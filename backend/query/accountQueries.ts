const getAccountInfoQuery = (accountId: bigint) => {
    return {
        text: 'SELECT * FROM accounts WHERE account_id = $1',
        values: [accountId],
    };
}

const getAccountInfowithLockQuery = (accountId1: bigint, accountId2: bigint) => {
    return {
        text: 'SELECT * FROM accounts WHERE account_id IN ($1, $2) ORDER BY account_id FOR UPDATE',
        values: [accountId1, accountId2],
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

export {
    getAccountInfoQuery,
    getTransactionHistoryQuery,
    createAccountQuery,
    checkAccountExistQuery,
    checkAccountBalanceQuery,
    creditAccountBalanceQuery,
    debitAccountBalanceQuery,
    getAccountInfowithLockQuery
}