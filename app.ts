import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastifyPostgres from '@fastify/postgres';

const fastify = Fastify({
  logger: true
}).withTypeProvider<TypeBoxTypeProvider>();

// connect to postgres database
fastify.register(fastifyPostgres, {
  connectionString: process.env.POSTGRES_URL
});

export default fastify;