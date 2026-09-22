import fp from 'fastify-plugin';
import nodemailer from 'nodemailer';

async function mailerPlugin(fastify: any, options: any) {
  // Create the transporter using options passed during registration
  const transporter = nodemailer.createTransport(options.transport);

  // Decorate the fastify instance so it's accessible globally via fastify.mailer
  fastify.decorate('mailer', transporter);
}

export default fp(mailerPlugin, {
  name: 'mailer-plugin',
  fastify: '4.x'
});