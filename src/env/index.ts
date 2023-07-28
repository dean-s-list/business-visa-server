import { z } from "zod";
import { logErrorToConsole } from "../utils/general.js";

import "dotenv/config";

const envSchema = z.object({
    PORT: z
        .string()
        .default("8080")
        .transform((val) => parseInt(val)),
    APP_SECRET: z.string().nonempty(),

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

    // qstash
    QSTASH_URL: z.string().url(),
    QSTASH_TOKEN: z.string().nonempty(),
    QSTASH_CURRENT_SIGNING_KEY: z.string().nonempty(),
    QSTASH_NEXT_SIGNING_KEY: z.string().nonempty(),

    // F Sphere
    SPHERE_PAYMENT_SUCCESS_WEBHOOK_SECRET: z.string().nonempty(),
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
