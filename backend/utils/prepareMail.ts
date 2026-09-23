type MailRole =
    | "payment_sender"
    | "payment_receiver"
    | "payment_depositor";

type PaymentStatus =
    | "completed"
    | "pending"
    | "failed"
    | "refunded";

type PaymentMailData = {
    paymentId: string;
    amount: number;
    currency: string;
    senderName: string;
    receiverName: string;
    status: PaymentStatus;
    createdAt: string;
    notes?: string;
};

export const prepareMail = (
    mail_role: MailRole,
    {
        paymentId,
        amount,
        currency,
        senderName,
        receiverName,
        status,
        createdAt,
        notes,
    }: PaymentMailData
) => {

    /*
     * STATUS CONFIGURATION
     */

    const statusMap: Record<
        PaymentStatus,
        {
            title: string;
            message: string;
            color: string;
            bg: string;
            icon: string;
        }
    > = {
        completed: {
            title: "Payment successful",
            message: "Your payment has been completed successfully.",
            color: "#15803d",
            bg: "#f0fdf4",
            icon: "✓",
        },

        pending: {
            title: "Payment pending",
            message: "Your payment is still being processed.",
            color: "#b45309",
            bg: "#fffbeb",
            icon: "•",
        },

        failed: {
            title: "Payment failed",
            message: "Your payment could not be completed.",
            color: "#b91c1c",
            bg: "#fef2f2",
            icon: "!",
        },

        refunded: {
            title: "Payment refunded",
            message: "This payment has been refunded.",
            color: "#6d28d9",
            bg: "#f5f3ff",
            icon: "↩",
        },
    };

    const currentStatus = statusMap[status];


    /*
     * FORMATTING
     */

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

    const formattedNotes = notes?.trim() || "";

    const notesText = formattedNotes
        ? `Notes: ${formattedNotes}\n`
        : "";


    /*
     * EMAIL CONTENT VARIABLES
     */

    let text: string;

    let heading: string;

    let description: string;

    let partyLabel: string;

    let partyName: string;


    /*
     * PAYMENT SENDER
     */

    if (mail_role === "payment_sender") {

        heading =
            status === "completed"
                ? "Payment sent"
                : currentStatus.title;

        description =
            status === "completed"
                ? `You sent ${currency} ${formattedAmount} to ${receiverName}.`
                : currentStatus.message;

        partyLabel = "Sent to";

        partyName = receiverName;


        text =
            `${heading}\n\n` +
            `${description}\n\n` +
            `Transaction details\n` +
            `Transaction ID: ${paymentId}\n` +
            `Amount: ${currency} ${formattedAmount}\n` +
            `Sent to: ${receiverName}\n` +
            notesText +
            `Date: ${formattedDate}\n` +
            `Status: ${status}\n`;
    }


    /*
     * PAYMENT RECEIVER
     */

    else if (mail_role === "payment_receiver") {

        heading =
            status === "completed"
                ? "Payment received"
                : currentStatus.title;

        description =
            status === "completed"
                ? `You received ${currency} ${formattedAmount} from ${senderName}.`
                : currentStatus.message;

        partyLabel = "Received from";

        partyName = senderName;


        text =
            `${heading}\n\n` +
            `${description}\n\n` +
            `Transaction details\n` +
            `Transaction ID: ${paymentId}\n` +
            `Amount: ${currency} ${formattedAmount}\n` +
            `Received from: ${senderName}\n` +
            notesText +
            `Date: ${formattedDate}\n` +
            `Status: ${status}\n`;
    }


    /*
     * DEPOSIT
     */

    else {

        heading =
            status === "completed"
                ? "Deposit successful"
                : status === "pending"
                    ? "Deposit pending"
                    : currentStatus.title;

        description =
            status === "completed"
                ? `${currency} ${formattedAmount} was added to your account.`
                : currentStatus.message;

        partyLabel = "Transaction";

        partyName = "Deposit";


        text =
            `${heading}\n\n` +
            `${description}\n\n` +
            `Transaction details\n` +
            `Transaction ID: ${paymentId}\n` +
            `Amount: ${currency} ${formattedAmount}\n` +
            notesText +
            `Date: ${formattedDate}\n` +
            `Status: ${status}\n`;
    }


    /*
     * OPTIONAL NOTES ROW
     *
     * Only included when notes exist.
     */

    const notesHtml = formattedNotes
        ? `
<tr>
    <td style="
        padding: 12px 0;
        font-size: 12px;
        color: #6b7280;
        border-bottom: 1px solid #e5e7eb;
        vertical-align: top;
    ">
        Notes
    </td>

    <td align="right" style="
        padding: 12px 0;
        font-size: 12px;
        font-weight: 600;
        color: #111827;
        border-bottom: 1px solid #e5e7eb;
        word-break: break-word;
        vertical-align: top;
    ">
        ${formattedNotes}
    </td>
</tr>
`
        : "";


    /*
     * HTML EMAIL
     */

    const html = `
<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>${heading}</title>

</head>


<body style="
    margin: 0;
    padding: 0;
    background-color: #f6f7f9;
    font-family: Arial, Helvetica, sans-serif;
    color: #111827;
">


<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        background-color: #f6f7f9;
    "
>

    <tr>

        <td
            align="center"
            style="
                padding: 32px 16px;
            "
        >


            <!-- EMAIL CARD -->

            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                    max-width: 520px;
                    background-color: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 10px;
                "
            >


                <!-- HEADER -->

                <tr>

                    <td style="
                        padding: 24px 28px;
                        border-bottom: 1px solid #e5e7eb;
                    ">

                        <div style="
                            font-size: 18px;
                            font-weight: 600;
                            color: #111827;
                        ">
                            ${heading}
                        </div>

                    </td>

                </tr>


                <!-- CONTENT -->

                <tr>

                    <td style="
                        padding: 28px;
                    ">


                        <!-- DESCRIPTION -->

                        <div style="
                            font-size: 13px;
                            line-height: 1.6;
                            color: #6b7280;
                        ">
                            ${description}
                        </div>


                        <!-- AMOUNT -->

                        <div style="
                            margin-top: 18px;
                            font-size: 30px;
                            line-height: 1.2;
                            font-weight: 600;
                            color: #111827;
                        ">
                            ${currency} ${formattedAmount}
                        </div>


                        <!-- STATUS -->

                        <div style="
                            display: inline-block;
                            margin-top: 14px;
                            padding: 5px 9px;
                            border-radius: 5px;
                            background-color: ${currentStatus.bg};
                            color: ${currentStatus.color};
                            font-size: 12px;
                            font-weight: 600;
                            text-transform: capitalize;
                        ">
                            ${status}
                        </div>


                        <!-- TRANSACTION DETAILS -->

                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="
                                margin-top: 28px;
                                border-top: 1px solid #e5e7eb;
                            "
                        >


                            <!-- PARTY -->

                            <tr>

                                <td style="
                                    padding: 12px 0;
                                    font-size: 12px;
                                    color: #6b7280;
                                    border-bottom: 1px solid #e5e7eb;
                                ">
                                    ${partyLabel}
                                </td>


                                <td
                                    align="right"
                                    style="
                                        padding: 12px 0;
                                        font-size: 13px;
                                        font-weight: 600;
                                        color: #111827;
                                        border-bottom: 1px solid #e5e7eb;
                                    "
                                >
                                    ${partyName}
                                </td>

                            </tr>


                            <!-- TRANSACTION ID -->

                            <tr>

                                <td style="
                                    padding: 12px 0;
                                    font-size: 12px;
                                    color: #6b7280;
                                    border-bottom: 1px solid #e5e7eb;
                                ">
                                    Transaction ID
                                </td>


                                <td
                                    align="right"
                                    style="
                                        padding: 12px 0;
                                        font-size: 12px;
                                        font-weight: 600;
                                        color: #111827;
                                        word-break: break-all;
                                        border-bottom: 1px solid #e5e7eb;
                                    "
                                >
                                    ${paymentId}
                                </td>

                            </tr>


                            <!-- AMOUNT -->

                            <tr>

                                <td style="
                                    padding: 12px 0;
                                    font-size: 12px;
                                    color: #6b7280;
                                    border-bottom: 1px solid #e5e7eb;
                                ">
                                    Amount
                                </td>


                                <td
                                    align="right"
                                    style="
                                        padding: 12px 0;
                                        font-size: 12px;
                                        font-weight: 600;
                                        color: #111827;
                                        border-bottom: 1px solid #e5e7eb;
                                    "
                                >
                                    ${currency} ${formattedAmount}
                                </td>

                            </tr>


                            <!-- NOTES -->

                            ${notesHtml}


                            <!-- DATE -->

                            <tr>

                                <td style="
                                    padding: 12px 0;
                                    font-size: 12px;
                                    color: #6b7280;
                                ">
                                    Date
                                </td>


                                <td
                                    align="right"
                                    style="
                                        padding: 12px 0;
                                        font-size: 12px;
                                        font-weight: 600;
                                        color: #111827;
                                    "
                                >
                                    ${formattedDate}
                                </td>

                            </tr>


                            <!-- STATUS -->

                            <tr>

                                <td style="
                                    padding: 12px 0;
                                    font-size: 12px;
                                    color: #6b7280;
                                ">
                                    Status
                                </td>


                                <td
                                    align="right"
                                    style="
                                        padding: 12px 0;
                                        font-size: 12px;
                                        font-weight: 600;
                                        color: ${currentStatus.color};
                                        text-transform: capitalize;
                                    "
                                >
                                    ${status}
                                </td>

                            </tr>

                        </table>

                    </td>

                </tr>


                <!-- SECURITY -->

                <tr>

                    <td style="
                        padding: 16px 28px;
                        background-color: #f9fafb;
                        border-top: 1px solid #e5e7eb;
                    ">

                        <div style="
                            font-size: 11px;
                            line-height: 1.6;
                            color: #6b7280;
                        ">
                            If you did not make or expect this transaction,
                            please review your account immediately.
                        </div>

                    </td>

                </tr>


            </table>

        </td>

    </tr>

</table>


</body>

</html>
`;


    /*
     * RETURN BOTH VERSIONS
     */

    return {
        text,
        html,
    };
};
