import fastify from './app';
import './apis/accounts';
import './apis/payments';

const port = Number(process.env.PORT ?? 3000);

fastify.get('/health', async (request, reply) => {
  reply.status(200).send({
    success: true,
    message: 'Server is healthy'
  });
});

await fastify.listen({ 
  port, 
  host: 'localhost' 
});