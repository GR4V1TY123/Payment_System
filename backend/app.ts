import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastifyPostgres from '@fastify/postgres';

const fastify = Fastify({
  logger: {
    level: 'info',

    transport: {
      targets: [
        {
          target: 'pino-pretty',
          level: 'info',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
        {
          target: 'pino/file',
          level: 'info',
          options: {
            destination: './logs/combined.log',
            mkdir: true,
          },
        },
        {
          target: 'pino/file',
          level: 'error',
          options: {
            destination: './logs/error.log',
            mkdir: true,
          },
        },
      ],
    },
  },
}).withTypeProvider<TypeBoxTypeProvider>();

// connect to postgres database
fastify.register(fastifyPostgres, {
  connectionString: process.env.POSTGRES_URL
});

export default fastify;