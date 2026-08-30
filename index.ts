import dotenv from 'dotenv';
import Fastify from 'fastify'
import fastifyPostgres from '@fastify/postgres';
import { Type } from 'typebox'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { accountSchema, paymentSchema } from './schemas/bodySchemas';
import { createAccountQuery, createPaymentQuery, getAccountInfoQuery, getPaymentDetailsQuery, getTransactionHistoryQuery } from './utils/query';

dotenv.config();

const fastify = Fastify({ logger: true })
  .withTypeProvider<TypeBoxTypeProvider>()


const port = parseInt(process.env.PORT || "3000");

// connect to postgres database
fastify.register(fastifyPostgres, {
  connectionString: process.env.POSTGRES_URL
});

// create payment
fastify.post('/payments', { schema: paymentSchema }, async (request, reply) => {
  const { sender_id, receiver_id, amount, currency, notes } = request.body;

  try {
    const query = createPaymentQuery(sender_id, receiver_id, amount, currency, notes);

    const result = await fastify.pg.query(query);

    if (result.rowCount === 0) {
      reply.status(400).send({
        success: false,
        message: 'Error creating payment',
        error: 'No rows affected'
      });
      return;
    }

    reply.status(200).send({
      success: true,
      rowCount: result.rowCount,
      rows: result.rows,
      message: 'Payment created successfully'
    });

  } catch (error) {
    reply.status(400).send({
      success: false,
      message: 'Error creating payment',
      error: (error as Error).message
    });
  }
});

// create account
fastify.post('/accounts', { schema: accountSchema }, async (request, reply) => {
  const { name, email, currency } = request.body;

  try {
    const query = createAccountQuery(name, email, currency);

    const result = await fastify.pg.query(query);

    if (result.rowCount === 0) {
      reply.status(400).send({
        success: false,
        message: 'Error creating account',
        error: 'No rows affected'
      });
      return;
    }

    reply.status(200).send({
      success: true,
      rowCount: result.rowCount,
      rows: result.rows,
      message: 'Account created successfully'
    });

  } catch (error) {
    reply.status(400).send({
      success: false,
      message: 'Error creating account', 
      error: (error as Error).message
    });
  }
});

// view a single payment record
fastify.get('/payments/:payment_id', async (request, reply) => {
  try {
    const { payment_id } = request.params as { payment_id: string };
    const query = getPaymentDetailsQuery(payment_id);

    const result = await fastify.pg.query(query);

    if (result.rowCount === 0) {
      reply.status(400).send({
        success: false,
        message: 'Payment not found',
        error: 'No rows returned'
      });
      return;
    }
    reply.status(200).send({
      success: true,
      message: 'Payment details retrieved successfully',
      rows: result.rows
    });
  } catch (error) {
    reply.status(400).send({
      success: false,
      message: 'Error retrieving payment details', 
      error: (error as Error).message
    });
  }
});

// view account details
fastify.get('/accounts/:account_id', async (request, reply) => {
  const { account_id } = request.params as { account_id: string };
  try {
    const query = getAccountInfoQuery(account_id);
    const result = await fastify.pg.query(query);

    if (result.rowCount === 0) {
      reply.status(400).send({
        success: false,
        message: 'Account not found',
        error: 'No rows returned'
      });
      return;
    }

    reply.status(200).send({
      success: true,
      message: 'Account details retrieved successfully',
      rows: result.rows
    });
  } catch (error) {
    reply.status(400).send({
      success: false,
      message: 'Error retrieving account details', 
      error: (error as Error).message
    });
  }
});

// view transaction history for a account
fastify.get('/accounts/:account_id/ledger', async (request, reply) => {
  const { account_id } = request.params as { account_id: string };
  try {
    const query = getTransactionHistoryQuery(account_id);
    const result = await fastify.pg.query(query);

    if (result.rowCount === 0) {
      reply.status(400).send({
        success: false,
        message: 'Transaction history not found',
        error: 'No rows returned'
      });
      return;
    }

    reply.status(200).send({
      success: true,
      message: 'Transaction history retrieved successfully',
      rows: result.rows
    });
  } catch (error) {
    reply.status(400).send({
      success: false,
      message: 'Error retrieving transaction history', 
      error: (error as Error).message
    });
  }
});

fastify.get('/health', async (request, reply) => {
  reply.status(200).send({
    success: true,
    message: 'Server is healthy'
  });
});

await fastify.listen({ port, host: 'localhost' });