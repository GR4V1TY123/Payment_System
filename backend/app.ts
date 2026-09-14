import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

export function buildFastify() {
  return Fastify({
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
        ],
      },
    },
  }).withTypeProvider<TypeBoxTypeProvider>();
}