import { addDays, format } from "date-fns";
import { eq } from "drizzle-orm";
import { writeFileSync } from "fs";
import { UNDERDOG_BUSINESS_VISA_PROJECT_ID } from "../constants/UNDERDOG.js";
import VISA_STATUS from "../constants/VISA_STATUS.js";
import db from "../db/index.js";
import { usersTable } from "../db/schema/index.js";
import { generateBusinessVisaImage } from "../services/bv.js";
import { sendVisaRenewedEmail } from "../services/emails.js";
import underdogApiInstance from "../services/underdog.js";
import { type NftDetails } from "../types/underdog.js";
import { logErrorToConsole, logToConsole } from "../utils/general.js";

const EMAILS = ["Emynem1417@gmail.com"];

const manualRenewVisaHolders = async () => {
    try {
        logToConsole("manualRenewVisaHolders started!");

        const failedEmails = [];

        for (const email of EMAILS) {
            try {
                const [bvHolder] = await db
                    .select()
                    .from(usersTable)
                    .where(eq(usersTable.email, email));

                if (!bvHolder) {
                    failedEmails.push(email);
                    continue;
                }

                const { walletAddress, nftId, nftIssuedAt, name, earnings } =
                    bvHolder;

                if (!nftId) {
                    continue;
                }

                const renewDate = new Date();

                const newExpireDate = addDays(renewDate, 30);

                const bvImageUrl = await generateBusinessVisaImage({
                    walletAddress,
                    name: name ?? "Dean's List DAO Member",
                    status: "Active",
                    earnings: earnings ? earnings.toFixed(2) : "0",
                });

                if (!bvImageUrl) {
                    throw new Error("Error generating business visa image!");
                }

                const nftUpdateResponse = await underdogApiInstance.patch(
                    `/v2/projects/n/${UNDERDOG_BUSINESS_VISA_PROJECT_ID}/nfts/${nftId}`,
                    {
                        image: bvImageUrl,
                        attributes: {
                            issuedAt: format(
                                nftIssuedAt ?? new Date(),
                                "dd MMMM yyyy hh:mm a"
                            ),
                            expiresAt: format(
                                newExpireDate,
                                "dd MMMM yyyy hh:mm a"
                            ),
                            status: VISA_STATUS.ACTIVE,
                        },
                    }
                );

                const nftUpdateResponseData =
                    nftUpdateResponse.data as NftDetails | null;

                if (!nftUpdateResponseData) {
                    throw new Error("Nft failed to update");
                }

                await db
                    .update(usersTable)
                    .set({
                        nftStatus: VISA_STATUS.ACTIVE,
                        nftRenewedAt: renewDate,
                        nftExpiresAt: newExpireDate,
                    })
                    .where(eq(usersTable.email, email));

                const emailId = await sendVisaRenewedEmail({
                    to: email,
                    subject: "Your business visa has been renewed!",
                });

                if (!emailId) {
                    throw new Error("Error sending visa renewed email!");
                }
            } catch (error) {
                logErrorToConsole(
                    `renewal for email ${email} failed =>`,
                    error
                );

                failedEmails.push(email);

                writeFileSync(
                    "failedRenewEmails.json",
                    JSON.stringify(failedEmails, null, 4)
                );
            }
        }

        logToConsole("Emails renewed successfully!", {
            total: EMAILS.length,
            failed: failedEmails.length,
        });
    } catch (error) {
        logErrorToConsole("manualRenewVisaHolders error =>", error);
    }
};

export default manualRenewVisaHolders;

manualRenewVisaHolders().catch((error) => {
    logErrorToConsole("manualRenewVisaHolders error =>", error);
});
