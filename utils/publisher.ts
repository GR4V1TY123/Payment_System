// get unpublished payments from the outbox table and publish them to the payment queue

import { pool } from "../messaging/db";
import { publishToQueue } from "../messaging/paymentQueue";
import { getUnpublishedOutboxEntriesQuery, updateOutboxEntryAsPublishedQuery } from "../query/outboxQueries";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getUnpublishedEvents = async () => {
    try {
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
    } catch (error) {
        console.error({
            message: 'Error fetching unpublished payments from outbox',
            error: (error as Error).message
        });
    }
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
                    console.log({
                        message: `Successfully published payment with event_id: ${event.event_id} to RabbitMQ and marked as published.`,
                        event_id: event.event_id,
                        payment_id: event.payload.payment_id
                    });

                } catch (error) {
                    console.error({
                        message: `Error publishing payment with event_id: ${event.event_id} to RabbitMQ`,
                        error: (error as Error).message
                    });
                }
            }
        } catch (error) {
            console.error({
                message: 'Error in getUnpublishedPayments loop',
                error: (error as Error).message
            });
            await sleep(2000); // Wait for 2 seconds before retrying
        }
    }
}