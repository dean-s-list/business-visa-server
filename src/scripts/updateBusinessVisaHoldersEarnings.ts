import { logErrorToConsole, logToConsole } from "../utils/general.js";
import businessVisaHoldersEarnings from "../data/BUSINESS_VISA_HOLDERS_EARNINGS.json" assert { type: "json" };
import { writeFileSync } from "fs";
import db from "../db/index.js";
import { usersTable } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import { generateBusinessVisaImage } from "../services/bv.js";
import underdogApiInstance from "../services/underdog.js";
import { UNDERDOG_BUSINESS_VISA_PROJECT_ID } from "../constants/UNDERDOG.js";
import { format } from "date-fns";
import { type NftDetails } from "../types/underdog.js";

const updateBusinessVisaHoldersEarnings = async () => {
    try {
        logToConsole("updateBusinessVisaHoldersEarnings started!");

        const failedUpdateEarningsWallet = [];

        for (const holder of businessVisaHoldersEarnings) {
            const { wallet, earnings } = holder;

            try {
                logToConsole("Update user earnings in db =>", holder);

                await db
                    .update(usersTable)
                    .set({
                        earnings,
                    })
                    .where(eq(usersTable.walletAddress, wallet));

                logToConsole("Fetch nft id from db for user =>", wallet);

                const [user] = await db
                    .select()
                    .from(usersTable)
                    .where(eq(usersTable.walletAddress, wallet));

                if (!user.nftId) {
                    throw new Error("User nft id not found!");
                }

                logToConsole("Generate user bv image =>", user.walletAddress);

                const bvImageUrl = await generateBusinessVisaImage({
                    walletAddress: user.walletAddress,
                    name: user.name ?? "Dean's List DAO Member",
                    status: user.nftStatus === "active" ? "Active" : "Expired",
                    earnings: `${earnings} USDC`,
                });

                if (!bvImageUrl) {
                    throw new Error("Error generating business visa image!");
                }

                logToConsole("Update user nft in underdog =>", {
                    walletAddress: user.walletAddress,
                    nftId: user.nftId,
                    bvImageUrl,
                });

                const nftUpdateResponse = await underdogApiInstance.patch(
                    `/v2/projects/n/${UNDERDOG_BUSINESS_VISA_PROJECT_ID}/nfts/${user.nftId}`,
                    {
                        image: bvImageUrl,
                        attributes: {
                            issuedAt: format(
                                user.nftIssuedAt ?? new Date(),
                                "dd MMMM yyyy hh:mm a"
                            ),
                            expiresAt: format(
                                user.nftExpiresAt ?? new Date(),
                                "dd MMMM yyyy hh:mm a"
                            ),
                            status: user.nftStatus,
                        },
                    }
                );

                const nftUpdateResponseData =
                    nftUpdateResponse.data as NftDetails | null;

                if (!nftUpdateResponseData) {
                    throw new Error("Nft failed to update");
                }

                logToConsole("User bv and db updated successfully =>", wallet);
            } catch (error) {
                logErrorToConsole(
                    `update earnings for wallet ${wallet} failed =>`,
                    error
                );

                failedUpdateEarningsWallet.push(holder);

                writeFileSync(
                    "failedUpdateEarningsWallet.json",
                    JSON.stringify(failedUpdateEarningsWallet, null, 4)
                );
            }
        }

        logToConsole("User earnings in bv and db updated successfully!", {
            total: updateBusinessVisaHoldersEarnings.length,
            failed: failedUpdateEarningsWallet.length,
        });
    } catch (error) {
        logErrorToConsole("updateBusinessVisaHoldersEarnings error =>", error);
    }
};

export default updateBusinessVisaHoldersEarnings;

updateBusinessVisaHoldersEarnings().catch((error) => {
    logErrorToConsole("updateBusinessVisaHoldersEarnings error =>", error);
});
