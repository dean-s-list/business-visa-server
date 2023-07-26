import { connect } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";

import env from "../env/index.ts";

// create the connection
const connection = connect({
    url: env.DB_URL,
});

const db = drizzle(connection);

export default db;
