import cron from "node-cron";
import { logErrorToConsole, logToConsole } from "../utils/general.js";

import { and, eq, isNotNull } from "drizzle-orm";
import { DEANSLIST_EMAIL } from "../constants/EMAIL.js";
import { UNDERDOG_BUSINESS_VISA_PROJECT_ID } from "../constants/UNDERDOG.js";
import db from "../db/index.js";
import { acceptedApplicantsTable, usersTable } from "../db/schema/index.js";
import underdogApiInstance from "../services/underdog.js";
import type { NftDetails } from "../types/underdog.js";
import resend from "../services/resend.js";
import VISA_STATUS from "../constants/VISA_STATUS.js";

const verifyClaimStatus = async () => {
    try {
        logToConsole("verifyClaimStatusJob started!");

        const acceptedApplicants = await db
            .select()
            .from(acceptedApplicantsTable)
            .where(
                and(
                    isNotNull(acceptedApplicantsTable.nftClaimLink),
                    eq(acceptedApplicantsTable.hasClaimed, false)
                )
            );

        if (!acceptedApplicants) {
            throw new Error("No data found!");
        }

        if (acceptedApplicants.length === 0) {
            logToConsole("No accepted applicants who have not claimed yet!");
        }

        for (const applicant of acceptedApplicants) {
            try {
                if (!applicant.nftId) {
                    throw new Error(
                        `No nft id found for applicant ${applicant.id}`
                    );
                }

                const nftDetailsResponse = await underdogApiInstance.get(
                    `/v2/projects/n/${UNDERDOG_BUSINESS_VISA_PROJECT_ID}/nfts/${applicant.nftId}`
                );

                const nftDetails = nftDetailsResponse.data as NftDetails | null;

                if (!nftDetails) {
                    throw new Error("No nft details found!");
                }

                if (nftDetails.status === "confirmed") {
                    await db.transaction(async (tx) => {
                        await tx
                            .update(acceptedApplicantsTable)
                            .set({
                                hasClaimed: true,
                            })
                            .where(
                                eq(acceptedApplicantsTable.id, applicant.id)
                            );

                        await tx.insert(usersTable).values({
                            discordId: applicant.discordId,
                            email: applicant.email,
                            walletAddress: applicant.walletAddress,
                            country: applicant.country,
                            nftType: "business",
                            name: applicant.name,
                            nftExpiresAt: applicant.nftExpiresAt,
                            nftId: nftDetails.id,
                            nftIssuedAt: applicant.nftIssuedAt,
                            nftStatus: VISA_STATUS.ACTIVE,
                            role: "user",
                        });
                    });

                    await resend.sendEmail({
                        from: DEANSLIST_EMAIL,
                        to: applicant.email,
                        subject: "Thanks for claiming your business visa!",
                        text: `Your business visa nft has been successfully claimed!`,
                    });

                    logToConsole(
                        "nft claimed successfully for applicant id",
                        applicant.id
                    );
                }
            } catch (error) {
                logErrorToConsole(
                    "nft details not found for this applicant id",
                    applicant.id
                );
            }
        }

        logToConsole("verifyClaimStatusJob completed successfully!");
    } catch (error) {
        logErrorToConsole("verifyClaimStatusJob error =>", error);
    }
};

// it runs every 5 minutes
const verifyClaimStatusJob = cron.schedule("*/5 * * * *", verifyClaimStatus);

// for testing it runs every 1 minute
// const verifyClaimStatusJob = cron.schedule("*/1 * * * *", verifyClaimStatus);

export default verifyClaimStatusJob;
