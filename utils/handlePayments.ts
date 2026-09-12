import { pool } from "../messaging/db";
import { creditAccountBalanceQuery, debitAccountBalanceQuery, getAccountInfoQuery, getAccountInfowithLockQuery } from "../query/accountQueries";
import { createLedgerEntryQuery, getPaymentByIdQuery, updatePaymentStatusQuery } from "../query/paymentQueries";
import { lockQuery } from "./query";

export const handlePayment = async (paymentId: bigint) => {
    try {
        const query = getPaymentByIdQuery(paymentId);
        const paymentResult = await pool.query(query);
        const payment = paymentResult.rows[0];

        if (!payment) {
            return {
                success: false,
                retryable: false,
                message: 'Payment not found for payment ID: ' + paymentId,
            };
        }

        const payment_type = payment.payment_type;

        // check if payment is deposit or transfer
        if (payment_type === 'DEPOSIT') {
            // deposit payment
            return await depositPayment(paymentId);
        } else {
            // transfer payment
            return await transferAmount(paymentId);
        }
    } catch (error) {
        console.log({
            message: `Error handling payment with ID: ${paymentId}`,
            error
        });
        throw error;
    }
}

export const transferAmount = async (paymentId: bigint) => {
    const client = await pool.connect();
    try {
        // Transactional operations for payment processing
        await client.query("BEGIN");

        // lock payment
        const query = lockQuery(getPaymentByIdQuery(paymentId));
        console.log(`Executing query to fetch payment details: ${query.text} with values: ${query.values}`);

        const paymentResult = await client.query(query);
        const payment = paymentResult.rows[0];

        if (!payment) {
            await client.query("ROLLBACK");
            return {
                success: false,
                retryable: false,
                message: 'Payment not found for payment ID: ' + paymentId,
            };
        }

        if (payment.status === 'completed') {
            await client.query("COMMIT");
            return {
                success: true,
                retryable: false,
                message: 'Payment already completed for payment ID: ' + paymentId,
            };
        }

        if (payment.status !== 'pending') {
            await client.query("ROLLBACK");
            return {
                success: false,
                retryable: false,
                message: 'Payment is not in pending status for payment ID: ' + paymentId,
            };
        }

        // Operation 1: Update payment status to 'processing'
        const statusUpdateQuery = updatePaymentStatusQuery(paymentId, 'processing');
        await client.query(statusUpdateQuery);

        // Operation 2: Lock and check if sender and receiver exist
        const usersQuery = getAccountInfowithLockQuery(payment.sender_id, payment.receiver_id);

        const usersResult = await client.query(usersQuery);

        const sender = usersResult.rows.find((r: any) => {
            return r.account_id === payment.sender_id;
        })

        const receiver = usersResult.rows.find((r: any) => {
            return r.account_id === payment.receiver_id;
        })

        if (!sender) {
            await client.query(updatePaymentStatusQuery(paymentId, 'failed'));
            await client.query("COMMIT");
            return {
                success: false,
                retryable: false,
                message: 'Sender account does not exist for payment ID: ' + paymentId,
            };
        }

        if (!receiver) {
            await client.query(updatePaymentStatusQuery(paymentId, 'failed'));
            await client.query("COMMIT");
            return {
                success: false,
                retryable: false,
                message: 'Receiver account does not exist for payment ID: ' + paymentId,
            };
        }

        // Operation 3: Check if sender has enough balance
        const senderBalance = Number(sender.balance);

        if (senderBalance < Number(payment.amount)) {
            await client.query(updatePaymentStatusQuery(paymentId, 'failed'));
            await client.query("COMMIT");
            return {
                success: false,
                retryable: false,
                message: 'Insufficient balance in sender account for payment ID: ' + paymentId,
            };
        }

        // Operation 4: Deduct amount from sender and add to receiver
        const debitQuery = debitAccountBalanceQuery(payment.sender_id, payment.amount);
        const creditQuery = creditAccountBalanceQuery(payment.receiver_id, payment.amount);

        await client.query(debitQuery);
        await client.query(creditQuery);

        // Operation 5: Update payment status to 'completed'
        const finalStatusUpdateQuery = updatePaymentStatusQuery(paymentId, 'completed');
        await client.query(finalStatusUpdateQuery);

        // Operation 6: Create ledger entries for both sender and receiver
        const createSenderLedgerEntryQuery = createLedgerEntryQuery(payment.sender_id, paymentId, payment.amount, 'DEBIT');
        const createReceiverLedgerEntryQuery = createLedgerEntryQuery(payment.receiver_id, paymentId, payment.amount, 'CREDIT');
        await client.query(createSenderLedgerEntryQuery);
        await client.query(createReceiverLedgerEntryQuery);

        await client.query("COMMIT");

        return {
            success: true,
            retryable: false,
            message: 'Payment processed successfully for payment ID: ' + paymentId,
        };


    } catch (error) {
        await client.query("ROLLBACK");
        console.log({
            message: `Error processing payment with ID: ${paymentId}`,
            error
        });

        return {
            success: false,
            retryable: true,
            message: 'Error processing payment',
            error: (error as Error).message
        }
    } finally {
        // Release the client back to the pool
        client.release();
    }
}

export const depositPayment = async (paymentId: bigint) => {
    const client = await pool.connect();
    try {
        // Transactional operations for deposit processing
        await client.query("BEGIN");

        const query = lockQuery(getPaymentByIdQuery(paymentId));
        console.log(`Executing query to fetch payment details: ${query.text} with values: ${query.values}`);

        const paymentResult = await client.query(query);
        const payment = paymentResult.rows[0];

        if (!payment) {
            await client.query("ROLLBACK");
            return {
                success: false,
                retryable: false,
                message: 'Payment not found for payment ID: ' + paymentId,
            };
        }

        if (payment.status !== 'pending') {
            await client.query("ROLLBACK");
            return {
                success: false,
                retryable: false,
                message: 'Payment is not in pending status for payment ID: ' + paymentId,
            };
        }

        // Operation 1: Update payment status to 'processing'
        const statusUpdateQuery = updatePaymentStatusQuery(paymentId, 'processing');
        await client.query(statusUpdateQuery);

        // Operation 2: lock and check if receiver exists
        const receiverQuery = lockQuery(getAccountInfoQuery(payment.receiver_id));
        const receiver = (await client.query(receiverQuery)).rows[0];

        if (!receiver) {
            await client.query(updatePaymentStatusQuery(paymentId, 'failed'));
            await client.query("COMMIT");
            return {
                success: false,
                retryable: false,
                message: 'Receiver account does not exist for payment ID: ' + paymentId,
            };
        }

        // Operation 3: Add amount to receiver
        const creditQuery = creditAccountBalanceQuery(payment.receiver_id, payment.amount);
        await client.query(creditQuery);

        // Operation 4: Update payment status to 'completed'
        const finalStatusUpdateQuery = updatePaymentStatusQuery(paymentId, 'completed');
        await client.query(finalStatusUpdateQuery);

        // Operation 5: Create ledger entry for receiver
        const createReceiverLedgerEntryQuery = createLedgerEntryQuery(payment.receiver_id, paymentId, payment.amount, 'CREDIT');
        await client.query(createReceiverLedgerEntryQuery);

        await client.query("COMMIT");

        return {
            success: true,
            retryable: false,
            message: 'Deposit processed successfully for payment ID: ' + paymentId,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        console.log({
            message: `Error processing deposit with ID: ${paymentId}`,
            error
        });
        return {
            success: false,
            retryable: true,
            message: 'Error processing deposit',
            error: (error as Error).message
        }
    } finally {
        // Release the client back to the pool
        client.release();
    }
}