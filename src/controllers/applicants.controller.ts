import { addDays, format } from "date-fns";
import { desc, eq, or } from "drizzle-orm";
import type { Request, Response } from "express";
import { BUSINESS_VISA_PAYMENT_LINK_ID } from "../constants/SPHERE_PAY.js";
import { UNDERDOG_BUSINESS_VISA_PROJECT_ID } from "../constants/UNDERDOG.js";
import VISA_STATUS from "../constants/VISA_STATUS.js";
import db from "../db/index.js";
import {
    acceptedApplicantsTable,
    applicantsTable,
    usersTable,
} from "../db/schema/index.js";
import env from "../env/index.js";
import { generateBusinessVisaImage } from "../services/bv.js";
import { sendVisaRenewedEmail } from "../services/emails.js";
import underdogApiInstance from "../services/underdog.js";
import type { SphereWebhookResponse } from "../types/spherepay.js";
import type { NftDetails } from "../types/underdog.js";
import {
    handleApiAuthError,
    handleApiClientError,
    handleApiRouteError,
    successHandler,
} from "../utils/api.js";
import { logErrorToConsole, logToConsole } from "../utils/general.js";
import {
    acceptApplicantBodyValidator,
    postApplicationsBodyValidator,
} from "../validators/applicants.js";

export const getApplications = async (req: Request, res: Response) => {
    try {
        const secret = req.headers.authorization;

        if (!secret || secret !== env.APP_SECRET) {
            return handleApiAuthError(res);
        }

        const applications = await db
            .select()
            .from(applicantsTable)
            .orderBy(desc(applicantsTable.createdAt));

        return res
            .status(200)
            .json(
                successHandler(
                    applications,
                    "Applications fetched successfully"
                )
            );
    } catch (error) {
        logErrorToConsole("/getApplications error 500 =>", error);
        return handleApiRouteError(res, error);
    }
};

export const postApplication = async (req: Request, res: Response) => {
    try {
        logToConsole("/postApplication req.body", req.body);

        const bodyValidationResult = postApplicationsBodyValidator.safeParse(
            req.body
        );

        if (!bodyValidationResult.success) {
            logErrorToConsole(
                "/postApplication error 400 =>",
                bodyValidationResult.error
            );
            return handleApiClientError(res);
        }

        const body = bodyValidationResult.data;

        logToConsole(
            "/postApplication body validated",
            bodyValidationResult.data
        );

        logToConsole("/postApplication adding applicant to db");

        const [applicant] = await db
            .select()
            .from(applicantsTable)
            .where(
                or(
                    eq(applicantsTable.email, body.email),
                    eq(applicantsTable.walletAddress, body.walletAddress)
                )
            );

        if (applicant) {
            let message;

            if (applicant.status === "pending") {
                message = "Your application is already pending!";
            } else if (applicant.status === "accepted") {
                message = "Your application have already been accepted!";
            } else {
                message = "Your application have already been rejected!";
            }

            return handleApiClientError(res, message);
        }

        await db.insert(applicantsTable).values(body);

        logToConsole("/postApplication applicant added to db", body.email);

        return res.status(200).json(
            successHandler(
                {
                    applicantId: body.email,
                },
                "Application submitted successfully"
            )
        );
    } catch (error) {
        logErrorToConsole("/postApplication error 500 =>", error);
        return handleApiRouteError(res, error);
    }
};

export const acceptApplicant = async (req: Request, res: Response) => {
    try {
        logToConsole("/acceptApplicant req.body", req.body);

        const bodyValidationResult = acceptApplicantBodyValidator.safeParse(
            req.body
        );

        if (!bodyValidationResult.success) {
            logErrorToConsole(
                "/acceptApplicant error 400 =>",
                bodyValidationResult.error
            );
            return handleApiClientError(res);
        }

        const { secret, applicantId, status } = bodyValidationResult.data;

        logToConsole(
            "/acceptApplicant body validated",
            bodyValidationResult.data
        );

        if (secret !== env.APP_SECRET) {
            logErrorToConsole(
                "/acceptApplicant error 401 =>",
                "Secret is not valid"
            );
            return handleApiAuthError(res);
        }

        logToConsole("/acceptApplicant adding applicant to db");

        const [applicant] = await db
            .select()
            .from(applicantsTable)
            .where(eq(applicantsTable.id, applicantId));

        if (!applicant) {
            throw new Error("No applicant found!");
        }

        if (applicant.status === "accepted") {
            throw new Error("Applicant already accepted!");
        }

        if (applicant.status === "rejected") {
            throw new Error("Applicant already rejected!");
        }

        if (status === "rejected") {
            await db
                .update(applicantsTable)
                .set({
                    status: "rejected",
                })
                .where(eq(applicantsTable.id, applicantId));

            return res
                .status(200)
                .json(successHandler(null, "Applicant rejected successfully"));
        }

        await db.transaction(async (trx) => {
            await trx.insert(acceptedApplicantsTable).values({
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
                .where(eq(applicantsTable.id, applicantId));
        });

        logToConsole("/acceptApplicant applicant added to db", applicantId);

        return res
            .status(200)
            .json(
                successHandler(
                    { applicantId },
                    "Applicant accepted successfully"
                )
            );
    } catch (error) {
        logErrorToConsole("/acceptApplicant error 500 =>", error);
        return handleApiRouteError(res, error);
    }
};

export const renewVisa = async (req: Request, res: Response) => {
    try {
        if (
            req.headers.authorization !==
            env.SPHERE_PAYMENT_SUCCESS_WEBHOOK_SECRET
        ) {
            logErrorToConsole("/renewVisa error 401 =>", "Secret is not valid");
            return handleApiAuthError(res);
        }

        const body = req.body as SphereWebhookResponse;

        const paymentLinkId = body.data.payment.paymentLink.id;

        const userEmail = body.data.payment.personalInfo.email;

        if (!userEmail) {
            logErrorToConsole("/renewVisa error 400 =>", "No user email");
            return handleApiClientError(res);
        }

        if (paymentLinkId !== BUSINESS_VISA_PAYMENT_LINK_ID) {
            logErrorToConsole(
                "/renewVisa error 400 =>",
                "Wrong payment link id"
            );
            return handleApiClientError(res);
        }

        const usersData = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, userEmail));

        const user = usersData[0];

        if (!user) {
            throw new Error("No usersData found!");
        }

        const renewDate = new Date();

        const newExpireDate = addDays(renewDate, 30);

        console.log("user", user);

        if (!user.nftId) {
            throw new Error(`No nft id found for user id ${user.id}`);
        }

        const bvImageUrl = await generateBusinessVisaImage({
            walletAddress: user.walletAddress,
            name: user.name ?? "Dean's List DAO Member",
            status: "Active",
            earnings: "0",
        });

        if (!bvImageUrl) {
            throw new Error("Error generating business visa image!");
        }

        const nftUpdateResponse = await underdogApiInstance.patch(
            `/v2/projects/n/${UNDERDOG_BUSINESS_VISA_PROJECT_ID}/nfts/${user.nftId}`,
            {
                image: bvImageUrl,
                attributes: {
                    issuedAt: format(
                        user.nftIssuedAt ?? new Date(),
                        "dd MMMM yyyy hh:mm a"
                    ),
                    expiresAt: format(newExpireDate, "dd MMMM yyyy hh:mm a"),
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
            .where(eq(usersTable.email, userEmail));

        const emailId = await sendVisaRenewedEmail({
            to: user.email,
            subject: "Your business visa has been renewed!",
        });

        if (!emailId) {
            throw new Error("Error sending visa renewed email!");
        }

        return res.status(200).json(
            successHandler(
                {
                    userEmail,
                },
                "Business visa renewed successfully"
            )
        );
    } catch (error) {
        logErrorToConsole("/renewVisa error 500 =>", error);
        return handleApiRouteError(res, error);
    }
};
