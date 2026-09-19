export const paymentSchema = {
    body: {
        type: "object",
        required: ["amount", "currency"],
        properties: {
            sender_id: { type: "string" },
            receiver_id: { type: "string" },
            amount: { type: "number" },
            currency: { type: "string" },
            notes: { type: "string" }
        },
    },
    response: {
        200: {
            type: "object",
            properties: {
                success: { type: "boolean" },
                rowCount: { type: "number" },
                rows: { type: "array", items: { type: "object" } },
                message: { type: "string" },
            },
        },
        400: {
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                error: { type: "string" }
            },
        },
    },
}

export const accountSchema = {
    body: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
            name: { type: "string" },
            email: { type: "string" },
            currency: { type: "string" },
            password: { type: "string" }
        },
    },
    response: {
        200: {
            type: "object",
            properties: {
                success: { type: "boolean" },
                rowCount: { type: "number" },
                rows: { type: "array", items: { type: "object" } },
                message: { type: "string" },
            },
        },
        400: {
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                error: { type: "string" }
            },
        },
    },
}