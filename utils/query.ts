import { pool } from "../messaging/db";

type querySchema = {
    text: string,
    values?: any[] 
}

// query bolierplate
const runQuery = async (query: querySchema) => {

    try {
        return await pool.query(query);
    } catch (error) {
        console.log(
            { err: error },
            'Database query failed'
        );
        throw error;
    }
};

const lockQuery = (query: querySchema) => {
    return {
        ...query,
        text: query.text + ' FOR UPDATE'
    }
}


export {
    runQuery,
    lockQuery,
}