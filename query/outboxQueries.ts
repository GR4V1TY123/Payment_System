type paymentPayload = {
    payment_id: string;
}

const createOutboxEntryQuery = (aggregate_id: bigint, event_type: string, payload: paymentPayload) => {
    return {
        text: 'INSERT INTO outbox_events (aggregate_id, event_type, payload) VALUES ($1, $2, $3) RETURNING *',
        values: [aggregate_id, event_type, payload],
    };
}

const getUnpublishedOutboxEntriesQuery = () => {
    return {
        text: 'SELECT * FROM outbox_events WHERE published_at IS NULL ORDER BY created_at ASC',
        values: [],
    };
}

const updateOutboxEntryAsPublishedQuery = (event_id: bigint) => {
    return {
        text: 'UPDATE outbox_events SET published_at = NOW() WHERE event_id = $1 RETURNING *',
        values: [event_id],
    };
}


export {
    createOutboxEntryQuery,
    getUnpublishedOutboxEntriesQuery,
    updateOutboxEntryAsPublishedQuery,
}