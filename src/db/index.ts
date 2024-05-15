import { drizzle } from "drizzle-orm/mysql2";
import { createConnection } from "mysql2";
import env from "../env/index.js";

export const connection = createConnection({
    uri: env.DB_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    enableKeepAlive: true,
});

const db = drizzle(connection);

export default db;
