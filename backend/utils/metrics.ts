import client from 'prom-client';

// payments
const paymentsCreated = new client.Counter({
    name: 'payments_created_total',
    help: 'Total number of payments created',
    labelNames: ['payment_type'],
});

const paymentsSuccessful = new client.Counter({
    name: 'payments_successful_total',
    help: 'Total number of successful payments',
    labelNames: ['payment_type'],
});

const paymentsFailed = new client.Counter({
    name: 'payments_failed_total',
    help: 'Total number of failed payments',
    labelNames: ['payment_type'],
});

const paymentsRetried = new client.Counter({
    name: 'payments_retried_total',
    help: 'Total number of retried payments',
    labelNames: ['payment_type'],
});

const paymentsDuration = new client.Histogram({
    name: 'payments_duration_seconds',
    help: 'Duration of payment processing in seconds',
    labelNames: ['payment_type'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const paymentsAmount = new client.Histogram({
    name: 'payments_amount',
    help: 'Amount of payments processed',
    labelNames: ['payment_type'],
    buckets: [10, 50, 100, 500, 1000, 5000],
});

const paymentsInProgress = new client.Gauge({
    name: 'payments_in_progress',
    help: 'Number of payments currently being processed',
    labelNames: ['payment_type'],
});

const paymentsDeadLettered = new client.Counter({
    name: 'payments_dead_lettered_total',
    help: 'Total number of payments sent to dead letter queue',
    labelNames: ['payment_type'],
});

// accounts
const accountsCreated = new client.Counter({
    name: 'accounts_created_total',
    help: 'Total number of accounts created',
    labelNames: ['account_status'],
});

const accountsDeleted = new client.Counter({
    name: 'accounts_deleted_total',
    help: 'Total number of accounts deleted',
    labelNames: ['account_status'],
});

const accountsActive = new client.Gauge({
    name: 'accounts_active',
    help: 'Number of active accounts',
    labelNames: ['account_status'],
});

// outbox
const outboxPublished = new client.Counter({
    name: 'outbox_published_total',
    help: 'Total number of outbox messages published',
    labelNames: ['event_type'],
});

const outboxFailed = new client.Counter({
    name: 'outbox_failed_total',
    help: 'Total number of failed outbox messages',
    labelNames: ['event_type'],
});

const outboxRetried = new client.Counter({
    name: 'outbox_retried_total',
    help: 'Total number of retried outbox messages',
    labelNames: ['event_type'],
});

// rabbitmq
const messagesProcessed = new client.Counter({
    name: 'messages_processed_total',
    help: 'Total number of messages processed from RabbitMQ',
    labelNames: ['queue_name', 'event_type'],
});

const messagesInProgress = new client.Gauge({
    name: 'messages_in_progress',
    help: 'Number of messages currently being processed from RabbitMQ',
    labelNames: ['queue_name', 'event_type'],
});

// mail
const mailsSent = new client.Counter({
    name: 'mails_sent_total',
    help: 'Total number of mails sent',
    labelNames: ['mail_role'],
});

const mailsFailed = new client.Counter({
    name: 'mails_failed_total',
    help: 'Total number of mails failed to send',
    labelNames: ['mail_role'],
});

const mailsRetried = new client.Counter({
    name: 'mails_retried_total',
    help: 'Total number of mails retried to send',
    labelNames: ['mail_role'],
});

const mailsInProgress = new client.Gauge({
    name: 'mails_in_progress',
    help: 'Number of mails currently being processed',
});

const mailsDeadLettered = new client.Counter({
    name: 'mails_dead_lettered_total',
    help: 'Total number of mails sent to dead letter queue',
    labelNames: ['mail_role'],
});

const mailsDuration = new client.Histogram({
    name: 'mails_duration_seconds',
    help: 'Duration of mail processing in seconds',
    labelNames: ['mail_role', 'mail_status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
});


export {
    paymentsCreated,
    paymentsSuccessful,
    paymentsFailed,
    paymentsRetried,
    paymentsDuration,
    paymentsAmount,
    paymentsInProgress,
    paymentsDeadLettered,

    accountsCreated,
    accountsDeleted,
    accountsActive,

    outboxPublished,
    outboxFailed,
    outboxRetried,

    messagesProcessed,
    messagesInProgress,

    mailsSent,
    mailsFailed,
    mailsRetried,
    mailsInProgress,
    mailsDeadLettered,
    mailsDuration,
};