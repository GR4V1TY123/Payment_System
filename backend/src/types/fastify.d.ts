import "fastify";

import type {
    FastifyInstance,
    FastifyRequest,
    FastifyReply
} from "fastify";
import { Transporter } from "nodemailer";

declare module "fastify" {
    interface FastifyInstance {
        authenticateToken: (
            request: FastifyRequest,
            reply: FastifyReply
        ) => Promise<void>;
        mailer: Transporter;
    }
}