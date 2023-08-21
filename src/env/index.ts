import { z } from "zod";
import { logErrorToConsole } from "../utils/general.js";

import "dotenv/config";

const envSchema = z.object({
    PORT: z
        .string()
        .default("8080")
        .transform((val) => parseInt(val)),
    APP_SECRET: z.string().nonempty(),
    FRONTEND_API_URL: z.string().url(),
    TZ: z.string().nonempty(),
    AUTO_APPROVE_APPLICATIONS: z
        .union([z.literal("true"), z.literal("false")])
        .transform((val) => val === "true"),

    // Solana
    SOLANA_NETWORK: z.union([z.literal("mainnet-beta"), z.literal("devnet")]),
    SOLANA_MAINNET_RPC_URL: z.string().url().optional(),
    SOLANA_DEVNET_RPC_URL: z.string().url().optional(),

    // Planetscale
    DB_URL: z.string().nonempty(),

    // Resend
    RESEND_API_KEY: z.string().nonempty(),

    // Underdog
    UNDERDOG_API_KEY: z.string().nonempty(),

    // Qstash
    QSTASH_TOKEN: z.string().nonempty(),
    QSTASH_CURRENT_SIGNING_KEY: z.string().nonempty(),
    QSTASH_NEXT_SIGNING_KEY: z.string().nonempty(),
    QSTASH_MINT_VISA_TOPIC: z.union([
        z.literal("mint-visa"),
        z.literal("mint-visa-dev"),
    ]),

    // Sphere
    SPHERE_PAYMENT_SUCCESS_WEBHOOK_SECRET: z.string().nonempty(),
    BUSINESS_VISA_PAYMENT_LINK_ID: z.string().nonempty(),

    // ImageKit
    IMAGEKIT_URL: z.string().nonempty(),
    IMAGEKIT_API_KEY: z.string().nonempty(),
    IMAGEKIT_API_SECRET: z.string().nonempty(),
    IMAGEKIT_ENV: z.union([z.literal("prod"), z.literal("dev")]),

    // Airtable
    AIRTABLE_TOKEN: z.string().nonempty(),
});

const parseEnv = () => {
    try {
        const envValidationResult = envSchema.safeParse(process.env);

        if (!envValidationResult.success) {
            throw new Error(envValidationResult.error.message);
        }

        return envValidationResult.data;
    } catch (error) {
        logErrorToConsole("Error parsing environment variables =>", error);
        process.exit(1);
    }
};

const env = parseEnv();

export default env;
