import client from 'prom-client';
import { buildFastify } from './app';

import paymentRoutes from './apis/payments';
import accountRoutes from './apis/accounts';
import { authenticateToken } from './middleware/verifyToken';

const apiServer = buildFastify();
const register = client.register;

const port = Number(process.env.API_PORT ?? 3000);

apiServer.register(import('@fastify/jwt'), {
  secret: process.env.JWT_SECRET_KEY || 'mandar_secret_key',
  cookie: {
    cookieName: 'access_token',
    signed: false,
  },
})

apiServer.register(import('@fastify/cookie'))

apiServer.decorate("authenticateToken", authenticateToken);

apiServer.register(paymentRoutes);
apiServer.register(accountRoutes);

apiServer.get('/health', async (request, reply) => {
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

export { apiServer };