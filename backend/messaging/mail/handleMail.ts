import { getPaymentDetailsWithNamesQuery } from "../../query/paymentQueries";
import { mailLogger } from "../../utils/logger";
import { prepareMail } from "../../utils/prepareMail";
import { pool } from "../db";
import { mailServer } from "./worker";

export const handleMail = async (payment_id: bigint, recipent_email: string) => {
    try {
        // get payment details from database
        const paymentQuery = getPaymentDetailsWithNamesQuery(payment_id);
        const paymentResult = await pool.query(paymentQuery);

        if (paymentResult.rowCount === 0) {
            mailLogger.error({
                message: 'Payment not found in database',
                payment_id
            });
            return {
                success: false,
                retryable: false,
                error: 'Payment not found in database'
            };
        }

        const payment = paymentResult.rows[0];

        const mailBodyPayload = {
            paymentId: payment.payment_id,
            amount: payment.amount,
            currency: payment.currency,
            senderName: payment.sender_name,
            receiverName: payment.receiver_name,
            status: payment.status,
            createdAt: payment.created_at,
        };

        const body = prepareMail(mailBodyPayload);
        
        let subject;
        if(payment.payment_type === 'TRANSFER') {
            subject = `Payment Successful: Your payment to ${payment.receiver_name} with ID ${payment.payment_id} has been processed`;
        } else if(payment.payment_type === 'DEPOSIT') {
            subject = `Deposit Successful: Your deposit with ID ${payment.payment_id} has been processed`;
        }

        // send mail via nodemailer
        const mailOptions = {
            from: process.env.SMTP_FROM_EMAIL,
            to: recipent_email,
            subject: subject,
            html: body
        };

        const info = await mailServer.mailer.sendMail(mailOptions);
        
        mailLogger.info({
            message: 'Mail sent successfully',
            payment_id,
            recipent_email,
            info: info
        });
        return {
            success: true,
            retryable: false
        };

    } catch (error) {
        mailLogger.error({
            message: 'Error occurred while processing mail',
            payment_id,
            recipent_email,
            error: error instanceof Error ? error.message : String(error)
        });
        return {
            success: false,
            retryable: true,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}