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

        let subject;

        let mail_role: "payment_sender" | "payment_receiver" | "payment_depositor"; // default role
        mail_role = 'payment_depositor'; // default role
        if (payment.payment_type === 'TRANSFER') {
            if (payment.sender_email === recipent_email) {
                mail_role = 'payment_sender';
            } else if (payment.receiver_email === recipent_email) {
                mail_role = 'payment_receiver';
            }
        }

        if (mail_role === 'payment_sender') {
            subject = `You have sent a payment of ${payment.amount} ${payment.currency} to ${payment.receiver_name}`;
        } else if (mail_role === 'payment_receiver') {
            subject = `You have received a payment of ${payment.amount} ${payment.currency} from ${payment.sender_name}`;
        } else if (mail_role === 'payment_depositor') {
            subject = `You have deposited ${payment.amount} ${payment.currency} to your account`;
        }

        const mailBodyPayload = {
            paymentId: payment.payment_id,
            amount: payment.amount,
            currency: payment.currency,
            senderName: payment.sender_name,
            receiverName: payment.receiver_name,
            status: payment.status,
            createdAt: payment.created_at,
            notes: payment.notes,
        };

        const body = prepareMail(mail_role, mailBodyPayload);

        // send mail via nodemailer
        const mailOptions = {
            from: process.env.SMTP_FROM_EMAIL,
            to: recipent_email,
            subject: subject,
            text: body.text, // fallback text version of the email
            html: body.html
        };

        const info = await mailServer.mailer.sendMail(mailOptions);

        mailLogger.info({
            message: 'Mail sent successfully',
            payment_id,
            recipent_email,
            messageId: info.messageId
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