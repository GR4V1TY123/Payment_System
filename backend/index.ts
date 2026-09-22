import client from 'prom-client';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimiter from '@fastify/rate-limit';

import { buildFastify } from './app';
import { startRedisSubscriber } from './utils/redis/redisSubsriber';

import paymentRoutes from './apis/payments';
import accountRoutes from './apis/accounts';
import { authenticateToken } from './middleware/verifyToken';

const apiServer = buildFastify();
const register = client.register;

const port = Number(process.env.API_PORT ?? 3000);

await apiServer.register(cors, {
  origin: 'http://localhost:5000',
  credentials: true,
});

await apiServer.register(jwt, {
  secret: process.env.JWT_SECRET_KEY || 'mandar_secret_key',
  cookie: {
    cookieName: 'access_token',
    signed: false,
  },
})

await apiServer.register(cookie)

await apiServer.register(rateLimiter, {
  max: 100, // maximum number of requests
  timeWindow: '1 minute', // time window for the rate limit
})

apiServer.decorate("authenticateToken", authenticateToken);

apiServer.register(paymentRoutes);
apiServer.register(accountRoutes);

apiServer.get('/api/health', async (request, reply) => {
  reply.status(200).send({
    success: true,
    message: 'Server is healthy'
  });
});

apiServer.get('/metrics', async (request, reply) => {
  reply.header('Content-Type', register.contentType);
  return register.metrics();
});

await apiServer.listen({
  port,
  host: '0.0.0.0'
});

startRedisSubscriber().catch((error) => {
  console.error('Failed to start Redis subscriber:', error);
  process.exit(1);
});

export { apiServer };