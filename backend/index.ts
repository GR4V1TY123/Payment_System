import client from 'prom-client';
import { buildFastify } from './app';

import paymentRoutes from './apis/payments';
import accountRoutes from './apis/accounts';

const apiServer = buildFastify();
const register = client.register;

const port = Number(process.env.API_PORT ?? 3000);

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