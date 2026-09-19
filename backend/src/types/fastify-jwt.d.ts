// src/types/fastify-jwt.d.ts

import "@fastify/jwt";
import "@fastify/cookie";

declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: {
            sub: string;
            name: string;
            email: string;
        };

        user: {
            sub: string;
            name: string;
            email: string;
        };

    }
}