import { connect } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";

import env from "../env/index.js";
import { fetch } from "undici";

// create the connection
const connection = connect({
    url: env.DB_URL,
    fetch,
});

const db = drizzle(connection);

export default db;
