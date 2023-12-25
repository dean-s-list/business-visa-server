import { logErrorToConsole, logToConsole } from "../utils/general.js";
import { writeFileSync } from "fs";
import db from "../db/index.js";
import { usersTable } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import underdogApiInstance from "../services/underdog.js";
import { UNDERDOG_BUSINESS_VISA_PROJECT_ID } from "../constants/UNDERDOG.js";
import { addDays, format } from "date-fns";
import { type NftDetails } from "../types/underdog.js";

const updateBusinessVisaHolderExpiryDate = async () => {
    try {
        logToConsole("updateBusinessVisaHolderExpiryDate started!");

        const failedUpdateExpiryWallet = [];

        const activeBvHolders = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.nftStatus, "active"));

        for (const holder of activeBvHolders) {
            const {
                nftExpiresAt,
                id,
                walletAddress,
                nftId,
                nftIssuedAt,
                nftStatus,
            } = holder;

            if (!nftExpiresAt || !nftId) {
                continue;
            }

            const newExpiresAt = addDays(new Date(nftExpiresAt), 7);

            try {
                logToConsole("Update user expiry in db =>", holder);

                await db
                    .update(usersTable)
                    .set({
                        nftExpiresAt: newExpiresAt,
                    })
                    .where(eq(usersTable.id, id));

                logToConsole("Update user nft in underdog =>", {
                    walletAddress,
                    nftId,
                });

                const nftUpdateResponse = await underdogApiInstance.patch(
                    `/v2/projects/n/${UNDERDOG_BUSINESS_VISA_PROJECT_ID}/nfts/${nftId}`,
                    {
                        attributes: {
                            issuedAt: format(
                                nftIssuedAt ?? new Date(),
                                "dd MMMM yyyy hh:mm a"
                            ),
                            expiresAt: format(
                                newExpiresAt ?? new Date(),
                                "dd MMMM yyyy hh:mm a"
                            ),
                            status: nftStatus,
                        },
                    }
                );

                const nftUpdateResponseData =
                    nftUpdateResponse.data as NftDetails | null;

                if (!nftUpdateResponseData) {
                    throw new Error("Nft failed to update");
                }

                logToConsole(
                    "User bv and db updated successfully =>",
                    walletAddress
                );
            } catch (error) {
                logErrorToConsole(
                    `update expiry for wallet ${walletAddress} failed =>`,
                    error
                );

                failedUpdateExpiryWallet.push(holder);

                writeFileSync(
                    "failedUpdateExpiryWallet.json",
                    JSON.stringify(failedUpdateExpiryWallet, null, 4)
                );
            }
        }

        logToConsole("User expiry in bv and db updated successfully!", {
            total: activeBvHolders.length,
            failed: failedUpdateExpiryWallet.length,
        });
    } catch (error) {
        logErrorToConsole("updateBusinessVisaHolderExpiryDate error =>", error);
    }
};

export default updateBusinessVisaHolderExpiryDate;

updateBusinessVisaHolderExpiryDate().catch((error) => {
    logErrorToConsole("updateBusinessVisaHolderExpiryDate error =>", error);
});
