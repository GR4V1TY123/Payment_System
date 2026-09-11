import fastify from "../app";
import { createPayment, getPaymentDetails } from "../controllers/payment";
import { paymentSchema } from "../schemas/bodySchemas";

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