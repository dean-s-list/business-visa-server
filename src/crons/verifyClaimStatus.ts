import cron from "node-cron";
import { logErrorToConsole, logToConsole } from "../utils/general.ts";

import { and, eq, isNotNull } from "drizzle-orm";
import { DEANSLIST_EMAIL } from "../constants/EMAIL.ts";
import { UNDERDOG_BUSINESS_VISA_PROJECT_ID } from "../constants/UNDERDOG.ts";
import db from "../db/index.ts";
import { acceptedApplicantsTable, usersTable } from "../db/schema/index.ts";
import underdogApiInstance from "../services/underdog.ts";
import type { NftDetails } from "../types/underdog.ts";
import resend from "../services/resend.ts";
import VISA_STATUS from "../constants/VISA_STATUS.ts";

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

// it runs every 15 minutes
const verifyClaimStatusJob = cron.schedule("*/15 * * * *", verifyClaimStatus);

// for testing it runs every 1 minute
// const verifyClaimStatusJob = cron.schedule("*/1 * * * *", verifyClaimStatus);

export default verifyClaimStatusJob;
