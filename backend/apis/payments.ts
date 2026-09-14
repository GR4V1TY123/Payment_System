
import { createPayment, getPaymentDetails } from "../controllers/payment";
import { paymentSchema } from "../schemas/bodySchemas";
import type {FastifyInstance} from "fastify";

export default async function paymentRoutes(
    fastify: FastifyInstance,
) {
    // create payment
    fastify.post(
        '/payments',
        { schema: paymentSchema },
        createPayment
    );

    // view a single payment record
    fastify.get(
        '/payments/:payment_id',
        getPaymentDetails
    );
}