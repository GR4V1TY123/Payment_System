import type { FastifyReply, FastifyRequest } from "fastify";

export async function authenticateToken(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        await request.jwtVerify();
    } catch {
        return reply.status(401).send({
            success: false,
            message: "Access token is missing or invalid",
        });
    }
}