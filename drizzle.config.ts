import type { Config } from "drizzle-kit";
import env from "./src/env/index.ts";

export default {
    schema: "./src/db/schema/index.ts",
    out: "./src/db/migrations",
    driver: "mysql2",
    dbCredentials: {
        database: "business-visa-app",
        connectionString: env.DB_URL,
    },
    breakpoints: true,
} satisfies Config;
