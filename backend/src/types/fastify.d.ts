import "fastify";

import type {
    FastifyInstance,
    FastifyRequest,
    FastifyReply
} from "fastify";

declare module "fastify" {
    interface FastifyInstance {
        authenticateToken: (
            request: FastifyRequest,
            reply: FastifyReply
        ) => Promise<void>;
    }
}