import { pool } from "../messaging/db";
import {
    checkAccountBalanceQuery,
    checkAccountExistQuery,
    createLedgerEntryQuery,
    creditAccountBalanceQuery,
    debitAccountBalanceQuery,
    getPaymentByIdQuery,
    updatePaymentStatusQuery
} from "./query";

export const handlePayment = async (paymentId: bigint) => {
    try {
        const query = getPaymentByIdQuery(paymentId);
        console.log(`Executing query to fetch payment details: ${query.text} with values: ${query.values}`);
        const paymentResult = await pool.query(query);
        const payment = paymentResult.rows[0];
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

        const query = getPaymentByIdQuery(paymentId);
        console.log(`Executing query to fetch payment details: ${query.text} with values: ${query.values}`);

        const paymentResult = await client.query(query);
        const payment = paymentResult.rows[0];

        // Operation 1: Update payment status to 'processing'
        const statusUpdateQuery = updatePaymentStatusQuery(paymentId, 'processing');
        await client.query(statusUpdateQuery);

        // Operation 2: Check if sender and receiver exist
        const senderQuery = checkAccountExistQuery(payment.sender_id);
        const receiverQuery = checkAccountExistQuery(payment.receiver_id);

        const sender = await client.query(senderQuery);
        const receiver = await client.query(receiverQuery);

        if (sender.rows.length == 0 || receiver.rows.length == 0) {
            throw new Error('Sender or receiver account does not exist');
        }

        // Operation 3: Check if sender has enough balance
        const checkSenderBalanceQuery = checkAccountBalanceQuery(payment.sender_id);
        const senderBalanceResult = await client.query(checkSenderBalanceQuery);

        const checkReceiverBalanceQuery = checkAccountBalanceQuery(payment.receiver_id);
        const receiverBalanceResult = await client.query(checkReceiverBalanceQuery);

        const senderBalance = Number(senderBalanceResult.rows[0].balance);
        const receiverBalance = Number(receiverBalanceResult.rows[0].balance);

        console.log({
            message: `Sender balance: ${senderBalance}, Receiver balance: ${receiverBalance}`,
            sender_id: payment.sender_id,
            receiver_id: payment.receiver_id,
            amount: payment.amount
        });

        if (senderBalance < Number(payment.amount)) {
            throw new Error('Insufficient balance in sender account');
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

        const query = getPaymentByIdQuery(paymentId);
        console.log(`Executing query to fetch payment details: ${query.text} with values: ${query.values}`);

        const paymentResult = await client.query(query);
        const payment = paymentResult.rows[0];

        // Operation 1: Update payment status to 'processing'
        const statusUpdateQuery = updatePaymentStatusQuery(paymentId, 'processing');
        await client.query(statusUpdateQuery);

        // Operation 2: Check if receiver exists
        const receiverQuery = checkAccountExistQuery(payment.sender_id);
        const receiver = await client.query(receiverQuery);
        if (receiver.rows.length == 0) {
            throw new Error('Receiver account does not exist');
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
            message: 'Error processing deposit',
            error: (error as Error).message
        }
    } finally {
        // Release the client back to the pool
        client.release();
    }
}
