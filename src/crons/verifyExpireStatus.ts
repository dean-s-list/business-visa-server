import cron from "node-cron";
import { logErrorToConsole, logToConsole } from "../utils/general.js";

import { and, eq, lte } from "drizzle-orm";
import { DEANSLIST_EMAIL } from "../constants/EMAIL.js";
import { UNDERDOG_BUSINESS_VISA_PROJECT_ID } from "../constants/UNDERDOG.js";
import db from "../db/index.js";
import { usersTable } from "../db/schema/index.js";
import underdogApiInstance from "../services/underdog.js";
import type { NftDetails } from "../types/underdog.js";
import resend from "../services/resend.js";
import VISA_STATUS from "../constants/VISA_STATUS.js";
import { BUSINESS_VISA_PAYMENT_LINK_URL } from "../constants/SPHERE_PAY.js";

const verifyExpireStatus = async () => {
    try {
        logToConsole("verifyExpireStatusJob started!");

        const expiredVisaUsers = await db
            .select()
            .from(usersTable)
            .where(
                and(
                    eq(usersTable.nftType, "business"),
                    eq(usersTable.nftStatus, VISA_STATUS.ACTIVE),
                    lte(usersTable.nftExpiresAt, new Date())
                )
            );

        if (!expiredVisaUsers) {
            throw new Error("No expiredVisaUsers found from db!");
        }

        if (expiredVisaUsers.length === 0) {
            logToConsole("No expired business visa users!");
        }

        for (const user of expiredVisaUsers) {
            try {
                if (!user.nftId) {
                    throw new Error(`No nft id found for user id ${user.id}`);
                }

                const nftUpdateResponse = await underdogApiInstance.patch(
                    `/v2/projects/n/${UNDERDOG_BUSINESS_VISA_PROJECT_ID}/nfts/${user.nftId}`,
                    {
                        attributes: {
                            issuedAt: user.nftIssuedAt?.getTime().toString(),
                            expiresAt: user.nftExpiresAt?.getTime().toString(),
                            status: VISA_STATUS.EXPIRED,
                        },
                    }
                );

                const nftUpdateResponseData =
                    nftUpdateResponse.data as NftDetails | null;

                console.log("nftDetails", nftUpdateResponseData);

                if (!nftUpdateResponseData) {
                    throw new Error("Nft failed to update");
                }

                await db
                    .update(usersTable)
                    .set({
                        nftStatus: VISA_STATUS.EXPIRED,
                    })
                    .where(eq(usersTable.id, user.id));

                await resend.sendEmail({
                    from: DEANSLIST_EMAIL,
                    to: user.email,
                    subject: "Your business visa has been expired!",
                    text: `Your business visa nft has been expired please renew using this link! ${BUSINESS_VISA_PAYMENT_LINK_URL}`,
                });

                console.log("sent expire email");
            } catch (error) {
                logErrorToConsole(
                    "Something went wrong to update nft status for user id",
                    user.id
                );
            }
        }

        logToConsole("verifyExpireStatusJob completed successfully!");
    } catch (error) {
        logErrorToConsole("verifyExpireStatusJob error =>", error);
    }
};

// it runs every 10 minutes
const verifyExpireStatusJob = cron.schedule("*/10 * * * *", verifyExpireStatus);

// for testing it runs every 1 minute
// const verifyExpireStatusJob = cron.schedule("*/1 * * * *", verifyExpireStatus);

export default verifyExpireStatusJob;
