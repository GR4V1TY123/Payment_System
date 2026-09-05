import dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";

const __dirname = path.resolve();
const envPath = `${__dirname}/../.env`;
dotenv.config({ path: envPath });

dotenv.config();
export const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});