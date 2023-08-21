import cron from "node-cron";
import { logErrorToConsole, logToConsole } from "../utils/general.js";

import db from "../db/index.js";
import { acceptedApplicantsTable } from "../db/schema/index.js";

import {
    BUSINESS_VISA_APPLICANTS_BASE_ID,
    BUSINESS_VISA_APPLICANTS_PROJECT_ID,
} from "../constants/AIRTABLE.js";
import airtable from "../services/airtable.js";
import type { Applicant } from "../types/applicant.js";
import qstashClient from "../services/qstash.js";
import env from "../env/index.js";
import { z } from "zod";
import { isValidSolanaAddress } from "../utils/solana.js";

const autoApproveApplications = async () => {
    try {
        logToConsole("autoApproveApplicationsJob started!");

        const data = await airtable
            .base(BUSINESS_VISA_APPLICANTS_BASE_ID)
            .table(BUSINESS_VISA_APPLICANTS_PROJECT_ID)
            .select()
            .all();

        if (!data) {
            throw new Error("No data found!");
        }

        if (data.length === 0) {
            logToConsole("No applications are pending!");
        }

        for (const applicant of data) {
            try {
                if (applicant.fields.status === "pending") {
                    const applicantData =
                        applicant.fields as unknown as Applicant;

                    if (
                        !z.string().email().safeParse(applicantData.email)
                            .success
                    ) {
                        throw new Error(
                            `Invalid email address for applicant id => ${applicant.id}`
                        );
                    }

                    if (
                        !z
                            .string()
                            .nonempty()
                            .refine((value) => isValidSolanaAddress(value))
                            .safeParse(applicantData.solana_wallet_address)
                            .success
                    ) {
                        throw new Error(
                            `Invalid wallet address for applicant id => ${applicant.id}`
                        );
                    }

                    const dbRes = await db
                        .insert(acceptedApplicantsTable)
                        .values({
                            walletAddress: applicantData.solana_wallet_address,
                            name: applicantData.name,
                            email: applicantData.email,
                            discordId: applicantData.discord_id,
                            country: applicantData.country,
                        });

                    const { messageId } = await qstashClient.publishJSON({
                        topic: env.QSTASH_MINT_VISA_TOPIC,
                        body: {
                            secret: env.APP_SECRET,
                            applicantId: dbRes.insertId,
                        },
                    });

                    console.log("messageId", messageId);

                    await airtable
                        .base(BUSINESS_VISA_APPLICANTS_BASE_ID)
                        .table(BUSINESS_VISA_APPLICANTS_PROJECT_ID)
                        .update(applicant.id, { status: "accepted" });
                }
            } catch (error) {
                logErrorToConsole(
                    "Something went wrong while accepting applicant id =>",
                    applicant.id
                );
            }
        }

        logToConsole("autoApproveApplicationsJob completed successfully!");
    } catch (error) {
        logErrorToConsole("autoApproveApplicationsJob error =>", error);
    }
};

// it runs every 1 minutes
const autoApproveApplicationsJob = cron.schedule(
    "*/1 * * * *",
    autoApproveApplications
);

export default autoApproveApplicationsJob;
