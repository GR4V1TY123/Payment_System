import { pool } from "../messaging/db";
import { databaseLogger } from "./logger";

type querySchema = {
    text: string,
    values?: any[] 
}

// query bolierplate
const runQuery = async (query: querySchema) => {

    try {
        return await pool.query(query);
    } catch (error) {
        databaseLogger.error({
            message: `Error executing query: ${query.text}`,
            error: (error as Error).message
        });
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