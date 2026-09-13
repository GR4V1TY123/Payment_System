import fs from "fs";
import pino from "pino";

fs.mkdirSync("./logs", { recursive: true });

const combinedLogStream = fs.createWriteStream(
    "./logs/combined.log",
    { flags: "a" }
);

const servicePaths = {
    paymentQueue: "./logs/paymentQueue.log",
    publisher: "./logs/publisher.log",
    worker: "./logs/worker.log",
    api: "./logs/api.log",
    database: "./logs/database.log",
};

const serviceLogStreams = Object.fromEntries(
    Object.entries(servicePaths).map(([service, path]) => [
        service,
        fs.createWriteStream(path, { flags: "a" }),
    ])
);

const prettyStream = pino.transport({
    target: "pino-pretty",
    options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
    },
});

const serviceStreams = Object.entries(serviceLogStreams).map(
    ([service, stream]) => ({
        stream: {
            write(chunk: string) {
                try {
                    const log = JSON.parse(chunk);

                    if (log.service === service) {
                        stream.write(chunk);
                    }
                } catch {
                    // Ignore malformed log entries
                }
            },
        },
    })
);

export const baseLogger = pino(
    {
        level: process.env.LOG_LEVEL ?? "info",
    },
    pino.multistream([
        // Pretty logs in terminal
        {
            stream: prettyStream,
        },

        // All logs
        {
            stream: combinedLogStream,
        },

        // Service-specific logs
        ...serviceStreams,
    ])
);

const paymentQueueLogger = baseLogger.child({
    service: "paymentQueue",
});

const publisherLogger = baseLogger.child({
    service: "publisher",
});

const workerLogger = baseLogger.child({
    service: "worker",
});

const apiLogger = baseLogger.child({
    service: "api",
});

const databaseLogger = baseLogger.child({
    service: "database",
});

export {
    paymentQueueLogger,
    publisherLogger,
    workerLogger,
    apiLogger,
    databaseLogger,
};