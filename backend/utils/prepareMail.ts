export const prepareMail = ({
    paymentId,
    amount,
    currency,
    senderName,
    receiverName,
    status,
    createdAt,
}: {
    paymentId: string;
    amount: number;
    currency: string;
    senderName: string;
    receiverName: string;
    status: "completed" | "pending" | "failed" | "refunded";
    createdAt: string;
}) => {

    const statusMap = {
        completed: {
            title: "Payment successful",
            message: "Your payment has been completed successfully.",
            color: "#16a34a",
            bg: "#f0fdf4",
            icon: "✓",
        },
        pending: {
            title: "Payment pending",
            message: "Your payment is currently being processed.",
            color: "#d97706",
            bg: "#fffbeb",
            icon: "•",
        },
        failed: {
            title: "Payment failed",
            message: "Unfortunately, your payment could not be completed.",
            color: "#dc2626",
            bg: "#fef2f2",
            icon: "!",
        },
        refunded: {
            title: "Payment refunded",
            message: "The payment has been refunded successfully.",
            color: "#7c3aed",
            bg: "#f5f3ff",
            icon: "↩",
        },
    };

    const currentStatus = statusMap[status];

    const formattedAmount = new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

    const formattedDate = new Date(createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Payment Notification</title>
</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #f5f7fa;
    font-family: Arial, Helvetica, sans-serif;
    color: #111827;
">

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        width: 100%;
        background-color: #f5f7fa;
        padding: 45px 16px;
    "
>
<tr>
<td align="center">

    <!-- EMAIL CARD -->

    <table
        width="560"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
            width: 100%;
            max-width: 560px;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
        "
    >

        <!-- HEADER -->

        <tr>
            <td style="
                padding: 24px 30px;
                border-bottom: 1px solid #edf0f3;
            ">

                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>

                        <td>
                            <div style="
                                font-size: 20px;
                                font-weight: 700;
                                color: #111827;
                                letter-spacing: -0.5px;
                            ">
                                PayFlow
                            </div>

                            <div style="
                                margin-top: 4px;
                                font-size: 11px;
                                color: #9ca3af;
                                letter-spacing: 0.5px;
                            ">
                                PAYMENT RECEIPT
                            </div>
                        </td>

                        <td align="right">
                            <div style="
                                width: 34px;
                                height: 34px;
                                line-height: 34px;
                                border-radius: 10px;
                                background-color: #111827;
                                color: #ffffff;
                                text-align: center;
                                font-size: 14px;
                                font-weight: 700;
                            ">
                                P
                            </div>
                        </td>

                    </tr>
                </table>

            </td>
        </tr>


        <!-- STATUS -->

        <tr>
            <td align="center" style="
                padding: 42px 30px 15px;
            ">

                <div style="
                    width: 58px;
                    height: 58px;
                    line-height: 58px;
                    border-radius: 50%;
                    background-color: ${currentStatus.bg};
                    color: ${currentStatus.color};
                    font-size: 26px;
                    font-weight: 700;
                    text-align: center;
                ">
                    ${currentStatus.icon}
                </div>

                <div style="
                    margin-top: 18px;
                    font-size: 22px;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                    color: #111827;
                ">
                    ${currentStatus.title}
                </div>

                <div style="
                    margin-top: 8px;
                    font-size: 13px;
                    line-height: 1.6;
                    color: #6b7280;
                ">
                    ${currentStatus.message}
                </div>

            </td>
        </tr>


        <!-- AMOUNT -->

        <tr>
            <td align="center" style="
                padding: 20px 30px 32px;
            ">

                <div style="
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: #9ca3af;
                    font-weight: 700;
                ">
                    Amount
                </div>

                <div style="
                    margin-top: 7px;
                    font-size: 38px;
                    font-weight: 700;
                    letter-spacing: -1.5px;
                    color: #111827;
                ">
                    ${currency} ${formattedAmount}
                </div>

            </td>
        </tr>


        <!-- PAYMENT FLOW -->

        <tr>
            <td style="
                padding: 0 30px 32px;
            ">

                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                        background-color: #f8fafc;
                        border-radius: 12px;
                    "
                >

                    <tr>

                        <!-- SENDER -->

                        <td width="42%" style="
                            padding: 20px;
                            vertical-align: top;
                        ">

                            <div style="
                                font-size: 10px;
                                color: #9ca3af;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                font-weight: 700;
                            ">
                                From
                            </div>

                            <div style="
                                margin-top: 7px;
                                font-size: 14px;
                                font-weight: 700;
                                color: #111827;
                            ">
                                ${senderName}
                            </div>

                        </td>


                        <!-- ARROW -->

                        <td width="16%" align="center" style="
                            vertical-align: middle;
                            color: #9ca3af;
                            font-size: 18px;
                        ">
                            →
                        </td>


                        <!-- RECEIVER -->

                        <td width="42%" style="
                            padding: 20px;
                            vertical-align: top;
                            text-align: right;
                        ">

                            <div style="
                                font-size: 10px;
                                color: #9ca3af;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                font-weight: 700;
                            ">
                                To
                            </div>

                            <div style="
                                margin-top: 7px;
                                font-size: 14px;
                                font-weight: 700;
                                color: #111827;
                            ">
                                ${receiverName}
                            </div>

                        </td>

                    </tr>

                </table>

            </td>
        </tr>


        <!-- DETAILS -->

        <tr>
            <td style="
                padding: 0 30px 35px;
            ">

                <div style="
                    font-size: 14px;
                    font-weight: 700;
                    color: #111827;
                    margin-bottom: 12px;
                ">
                    Transaction details
                </div>

                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                        border-top: 1px solid #edf0f3;
                    "
                >

                    <tr>
                        <td style="
                            padding: 13px 0;
                            font-size: 12px;
                            color: #6b7280;
                            border-bottom: 1px solid #edf0f3;
                        ">
                            Transaction ID
                        </td>

                        <td align="right" style="
                            padding: 13px 0;
                            font-size: 12px;
                            color: #111827;
                            font-weight: 600;
                            border-bottom: 1px solid #edf0f3;
                        ">
                            ${paymentId}
                        </td>
                    </tr>


                    <tr>
                        <td style="
                            padding: 13px 0;
                            font-size: 12px;
                            color: #6b7280;
                            border-bottom: 1px solid #edf0f3;
                        ">
                            Date
                        </td>

                        <td align="right" style="
                            padding: 13px 0;
                            font-size: 12px;
                            color: #111827;
                            font-weight: 600;
                            border-bottom: 1px solid #edf0f3;
                        ">
                            ${formattedDate}
                        </td>
                    </tr>


                    <tr>
                        <td style="
                            padding: 13px 0;
                            font-size: 12px;
                            color: #6b7280;
                        ">
                            Status
                        </td>

                        <td align="right" style="
                            padding: 13px 0;
                            font-size: 12px;
                            color: ${currentStatus.color};
                            font-weight: 700;
                            text-transform: capitalize;
                        ">
                            ${status}
                        </td>
                    </tr>

                </table>

            </td>
        </tr>


        <!-- SECURITY MESSAGE -->

        <tr>
            <td style="
                padding: 20px 30px;
                background-color: #f8fafc;
                border-top: 1px solid #edf0f3;
            ">

                <div style="
                    font-size: 11px;
                    line-height: 1.7;
                    color: #9ca3af;
                ">

                    <span style="
                        color: #6b7280;
                        font-weight: 700;
                    ">
                        Security reminder
                    </span>

                    <br>

                    Never share your password, PIN, OTP, or payment
                    credentials with anyone. PayFlow will never ask for
                    these details by email.

                </div>

            </td>
        </tr>


        <!-- FOOTER -->

        <tr>
            <td align="center" style="
                padding: 25px 30px;
                background-color: #111827;
            ">

                <div style="
                    color: #ffffff;
                    font-size: 13px;
                    font-weight: 700;
                ">
                    PayFlow
                </div>

                <div style="
                    margin-top: 6px;
                    color: #6b7280;
                    font-size: 10px;
                ">
                    Secure payment infrastructure
                </div>

                <div style="
                    margin-top: 12px;
                    color: #4b5563;
                    font-size: 9px;
                ">
                    This is an automated email. Please do not reply.
                </div>

            </td>
        </tr>

    </table>


    <!-- OUTSIDE FOOTER -->

    <div style="
        margin-top: 18px;
        color: #a1a8b3;
        font-size: 10px;
    ">
        © ${new Date().getFullYear()} PayFlow
    </div>

</td>
</tr>
</table>

</body>
</html>
    `;
};