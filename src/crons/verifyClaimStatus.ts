import cron from "node-cron";
import { logErrorToConsole, logToConsole } from "../utils/general.js";

import { and, eq, isNotNull } from "drizzle-orm";

import { UNDERDOG_BUSINESS_VISA_PROJECT_ID } from "../constants/UNDERDOG.js";
import db from "../db/index.js";
import { acceptedApplicantsTable, usersTable } from "../db/schema/index.js";
import underdogApiInstance from "../services/underdog.js";
import type { NftDetails } from "../types/underdog.js";

import VISA_STATUS from "../constants/VISA_STATUS.js";
import { sendVisaClaimedEmail } from "../services/emails.js";

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

                    const emailId = await sendVisaClaimedEmail({
                        to: applicant.email,
                        subject: "Thanks for claiming your business visa!",
                    });

                    if (!emailId) {
                        throw new Error("Error sending visa claimed email!");
                    }

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
