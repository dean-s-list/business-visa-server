import type { Config } from "drizzle-kit";
import "dotenv/config";

if (!process.env.DB_URL) {
    throw new Error("DB_URL not found in environment variables!");
}

export default {
    schema: "./src/db/schema/index.ts",
    out: "./src/db/migrations",
    driver: "mysql2",
    dbCredentials: {
        database: "business-visa-app",
        connectionString: process.env.DB_URL,
    },
    breakpoints: true,
} satisfies Config;
