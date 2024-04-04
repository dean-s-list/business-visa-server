import cron from "node-cron";
import { logErrorToConsole, logToConsole } from "../utils/general.js";

import db from "../db/index.js";
import {
    acceptedApplicantsTable,
    applicantsTable,
} from "../db/schema/index.js";

import { eq } from "drizzle-orm";
import env from "../env/index.js";
import qstashClient from "../services/qstash.js";

const autoApproveApplications = async () => {
    try {
        logToConsole("autoApproveApplicationsJob started!");

        const pendingApplicants = await db
            .select()
            .from(applicantsTable)
            .where(eq(applicantsTable.status, "pending"));

        for (const applicant of pendingApplicants) {
            try {
                const acceptedApplicantId = await db.transaction(
                    async (trx) => {
                        const { insertId } = await trx
                            .insert(acceptedApplicantsTable)
                            .values({
                                discordId: applicant.discordId,
                                email: applicant.email,
                                walletAddress: applicant.walletAddress,
                                country: applicant.country,
                                name: applicant.name,
                            });

                        await trx
                            .update(applicantsTable)
                            .set({
                                status: "accepted",
                            })
                            .where(eq(applicantsTable.id, applicant.id));

                        return insertId;
                    }
                );

                logToConsole(
                    "/acceptApplicant applicant added to db",
                    acceptedApplicantId
                );

                logToConsole(
                    "/acceptApplicant send qstash message to mint visa"
                );

                const { messageId } = await qstashClient.publishJSON({
                    topic: env.QSTASH_MINT_VISA_TOPIC,
                    body: {
                        secret: env.APP_SECRET,
                        applicantId: acceptedApplicantId,
                    },
                });

                logToConsole("/acceptApplicant qstash message sent", messageId);
            } catch (error) {
                logErrorToConsole(
                    `/autoApproveApplicationsJob error -> failed to accept the applicant ${applicant.id}`,
                    error
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
    "*/10 * * * *",
    autoApproveApplications
);

export default autoApproveApplicationsJob;
