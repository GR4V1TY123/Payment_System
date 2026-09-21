import { FastifyReply } from 'fastify';

const clients = new Map<string, FastifyReply>();

export const addClient = (account_id: string, reply: FastifyReply) => {
  clients.set(account_id, reply);

    reply.raw.on('close', () => {
        if (clients.get(account_id) === reply) {
            clients.delete(account_id);
        }
    });
}

export const sendEvent = (account_id: string, data: any) => {
    const client = clients.get(account_id);
    if (client) {
        client.raw.write(
            `event: payment.updated\n` +
            `data: ${JSON.stringify(data)}\n\n`
        );
        console.log(`Sent payment event to account_id: ${account_id}`);
    }
}