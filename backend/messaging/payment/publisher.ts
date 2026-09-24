// get unpublished payments from the outbox table and publish them to the payment queue
import { pool } from "../db";
import { publishToQueue } from "./sendToQueue";
import { getUnpublishedOutboxEntriesQuery, incrementAttemptCountQuery, updateOutboxEntryAsPublishedQuery } from "../../query/outboxQueries";
import { publisherLogger } from "../../utils/logger";
import { outboxFailed, outboxPublished, outboxRetried } from "../../utils/metrics";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


export const getUnpublishedEvents = async () => {
    const query = getUnpublishedOutboxEntriesQuery();
    const result = await pool.query(query);
    const unpublishedEvents = result.rows.map((row) => ({
        event_id: row.event_id,
        event_type: row.event_type,
        aggregate_id: row.aggregate_id,
        payload: row.payload,
        created_at: row.created_at,
    }));

    return unpublishedEvents;
}

export const fetchAndPublishPayments = async () => {
    while (true) {
        try {
            const unpublishedEvents = await getUnpublishedEvents();

            if (!unpublishedEvents || unpublishedEvents.length === 0) {
                await sleep(2000); // Wait for 2 seconds before checking again
                continue;
            }

            for (const event of unpublishedEvents) {
                try {
                    await publishToQueue(event.payload);

                    const query = updateOutboxEntryAsPublishedQuery(event.event_id);
                    await pool.query(query);
                    publisherLogger.info({
                        message: `Successfully published payment with event_id: ${event.event_id} to RabbitMQ and marked as published.`,
                        payment_id: event.payload.payment_id
                    });

                    outboxPublished.inc({ event_type: event.event_type });

                } catch (error) {

                    const incrementQuery = incrementAttemptCountQuery(event.event_id);
                    await pool.query(incrementQuery);

                    outboxFailed.inc({ event_type: event.event_type });
                    outboxRetried.inc({ event_type: event.event_type });

                    publisherLogger.error({
                        message: `Error publishing payment with event_id: ${event.event_id} to RabbitMQ. Incremented attempt count.`,
                        error: (error as Error).message,
                        payment_id: event.payload.payment_id
                    });
                }
            }
        } catch (error) {
            outboxFailed.inc({ event_type: 'FETCH_UNPUBLISHED_EVENTS' });
            publisherLogger.error({
                message: 'Error fetching unpublished events from the outbox table',
                error: (error as Error).message
            });
            await sleep(2000); // Wait for 2 seconds before retrying
        }
    }
}