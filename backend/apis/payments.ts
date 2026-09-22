
import { createPayment, getPaymentDetails } from "../controllers/payment";
import { paymentSchema } from "../schemas/bodySchemas";
import type { FastifyInstance } from "fastify";

export default async function paymentRoutes(
    fastify: FastifyInstance,
) {
    // create payment
    fastify.post<{
        Body: {
            receiver_id: string;
            amount: number;
            currency: string;
            notes?: string;
        };
    }>(
        '/payments',
        {
            onRequest: [fastify.authenticateToken],
            schema: paymentSchema,
            config: {
                rateLimit: {
                    max: 30, // maximum number of requests
                    timeWindow: '1 minute', // time window for the rate limit
                }
            }
        },
        createPayment
    );

    // view a single payment record
    fastify.get<{
        Params: {
            payment_id: string;
        };
    }>(
        '/payments/:payment_id',
        getPaymentDetails
    );
}