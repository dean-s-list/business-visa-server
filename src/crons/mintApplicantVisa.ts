import { addDays, format } from "date-fns";
import { eq, isNull } from "drizzle-orm";
import cron from "node-cron";
import { UNDERDOG_BUSINESS_VISA_PROJECT_ID } from "../constants/UNDERDOG.js";
import VISA_STATUS from "../constants/VISA_STATUS.js";
import db from "../db/index.js";
import { acceptedApplicantsTable } from "../db/schema/index.js";
import env from "../env/index.js";
import { generateBusinessVisaImage } from "../services/bv.js";
import { sendVisaAcceptedEmail } from "../services/emails.js";
import underdogApiInstance from "../services/underdog.js";
import type { GetAllNftsResponse, NftMintResponse } from "../types/underdog.js";
import { logErrorToConsole, logToConsole } from "../utils/general.js";

export const mintApplicantVisa = async ({
    applicantEmail,
}: {
    applicantEmail: string;
}) => {
    try {
        logToConsole(
            "fetching data from db for applicantEmail",
            applicantEmail
        );

        const applicantData = await db
            .select()
            .from(acceptedApplicantsTable)
            .where(eq(acceptedApplicantsTable.email, applicantEmail));

        const applicant = applicantData[0];

        if (!applicantData || !applicant) {
            throw new Error("No usersData found!");
        }

        if (applicant.nftId) {
            throw new Error("User already has a nft!");
        }

        const issueDate = new Date();

        const expireDate = addDays(issueDate, 30);

        const limit = 1;

        logToConsole("fetching all nfts from underdog");

        const getAllNftsResponse = await underdogApiInstance.get(
            `/v2/projects/n/${UNDERDOG_BUSINESS_VISA_PROJECT_ID}/nfts?limit=${limit}`
        );

        const getAllNftsResponseData =
            getAllNftsResponse.data as GetAllNftsResponse;

        if (!getAllNftsResponseData) {
            throw new Error("Error fetching nfts from underdog api!");
        }

        const nftMintedCount = getAllNftsResponseData?.totalPages;

        if (nftMintedCount < 0) {
            throw new Error("Error fetching nfts minted count!");
        }

        const bvImageUrl = await generateBusinessVisaImage({
            walletAddress: applicant.walletAddress,
            name: applicant.name ?? "Dean's List DAO Member",
            status: "Active",
            earnings: "0",
        });

        if (!bvImageUrl) {
            throw new Error("Error generating business visa image!");
        }

        const newNftIssueNumber = nftMintedCount + 1;

        const nftMetadata = {
            name: `Dean's List Business Visa #${newNftIssueNumber}`,
            description:
                "Keep this active to gain access to USDC earning opportunities.",
            symbol: "DLBV",
            image: bvImageUrl,
            attributes: {
                status: VISA_STATUS.ACTIVE,
                issuedAt: format(issueDate, "dd MMMM yyyy hh:mm a"),
                expiresAt: format(expireDate, "dd MMMM yyyy hh:mm a"),
            },
            receiverAddress: applicant.walletAddress,
        };

        logToConsole("creating nft on underdog", nftMetadata);

        const nftMintResponse = await underdogApiInstance.post(
            `/v2/projects/n/${UNDERDOG_BUSINESS_VISA_PROJECT_ID}/nfts`,
            nftMetadata
        );

        const nftMintResponseData = nftMintResponse.data as NftMintResponse;

        if (!nftMintResponseData) {
            throw new Error("Error minting nft!");
        }

        const underdogClaimLink = `https://claim.underdogprotocol.com/nfts/${
            nftMintResponseData.mintAddress
        }?network=${
            env.SOLANA_NETWORK === "mainnet-beta" ? "MAINNET" : "DEVNET"
        }`;

        logToConsole(
            "saving user nft data in db for applicantEmail",
            applicantEmail
        );

        await db
            .update(acceptedApplicantsTable)
            .set({
                nftId: nftMintResponseData.id,
                nftIssuedAt: issueDate,
                nftExpiresAt: expireDate,
                hasClaimed: false,
                nftClaimLink: underdogClaimLink,
                nftMintAddress: nftMintResponseData.mintAddress,
            })
            .where(eq(acceptedApplicantsTable.email, applicantEmail));

        logToConsole("sending claim email");

        const emailId = await sendVisaAcceptedEmail({
            to: applicant.email,
            subject: "Your Business Visa is ready!",
            businessVisaImage: bvImageUrl,
            claimLink: underdogClaimLink,
        });

        if (!emailId) {
            throw new Error("Error sending claim email!");
        }

        logToConsole("/mintApplicantVisa => claim email sent =>", {
            emailId,
            nftClaimLink: underdogClaimLink,
            nftMintAddress: nftMintResponseData.mintAddress,
        });
    } catch (error) {
        logErrorToConsole("/mintApplicantVisa error 500 =>", error);
    }
};

export async function mintPendingVisa() {
    try {
        logToConsole("fetching pending visa mints from db");

        const pendingMints = await db
            .select()
            .from(acceptedApplicantsTable)
            .where(isNull(acceptedApplicantsTable.nftId));

        if (!pendingMints || pendingMints.length === 0) {
            throw new Error("No pending mint found!");
        }

        for (const applicant of pendingMints) {
            try {
                await mintApplicantVisa({
                    applicantEmail: applicant.email,
                });
            } catch (error) {
                logErrorToConsole(
                    "/mintPendingVisa error -> failed to mint the visa",
                    {
                        error,
                        applicantEmail: applicant.email,
                    }
                );
            }
        }

        logToConsole("mintPendingVisa completed successfully!");
    } catch (error) {
        logErrorToConsole("mintPendingVisa error =>", error);
    }
}

// it runs every 30 minutes
const mintApplicantVisaJob = cron.schedule("*/30 * * * *", mintPendingVisa);

export default mintApplicantVisaJob;
