import { addDays, format } from "date-fns";
import { and, eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { UNDERDOG_BUSINESS_VISA_PROJECT_ID } from "../constants/UNDERDOG.js";
import VISA_STATUS from "../constants/VISA_STATUS.js";
import db from "../db/index.js";
import { usersTable } from "../db/schema/index.js";
import env from "../env/index.js";
import { generateBusinessVisaImage } from "../services/bv.js";
import {
    sendVisaExpiredEmail,
    sendVisaRenewedEmail,
} from "../services/emails.js";
import underdogApiInstance from "../services/underdog.js";
import type { NftDetails } from "../types/underdog.js";
import {
    handleApiAuthError,
    handleApiClientError,
    handleApiRouteError,
    successHandler,
} from "../utils/api.js";
import { logErrorToConsole, logToConsole } from "../utils/general.js";
import {
    expireVisaManuallyBodyValidator,
    renewVisaManuallyBodyValidator,
} from "../validators/applicants.js";
import {
    getUserQueryValidator,
    updateEarningsValidator,
} from "../validators/users.js";

export const getUser = async (req: Request, res: Response) => {
    try {
        const { walletAddress } = req.params;

        if (!walletAddress) {
            return handleApiClientError(res);
        }

        const queryValidationResult = getUserQueryValidator.safeParse(
            req.query
        );

        if (!queryValidationResult.success) {
            logErrorToConsole(
                "/getUser error 400 =>",
                queryValidationResult.error
            );
            return handleApiClientError(res);
        }

        const { secret, userType } = queryValidationResult.data;

        if (secret !== env.APP_SECRET) {
            logErrorToConsole(
                "/getUser error 401 =>",
                `Secret is not valid ${secret}`
            );
            return handleApiAuthError(res);
        }

        let users = null;

        if (userType !== undefined) {
            users = await db
                .select()
                .from(usersTable)
                .where(
                    and(
                        eq(usersTable.walletAddress, walletAddress),
                        eq(usersTable.role, userType)
                    )
                );
        } else {
            users = await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.walletAddress, walletAddress));
        }

        const user = users[0] ? users[0] : null;

        return res
            .status(200)
            .json(successHandler(user, "User fetched successfully"));
    } catch (error) {
        logErrorToConsole("/getUser error 500 =>", error);
        return handleApiRouteError(res, error);
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const queryValidationResult = getUserQueryValidator.safeParse(
            req.query
        );

        if (!queryValidationResult.success) {
            logErrorToConsole(
                "/getUsers error 400 =>",
                queryValidationResult.error
            );
            return handleApiClientError(res);
        }

        const { secret, userType } = queryValidationResult.data;

        if (secret !== env.APP_SECRET) {
            logErrorToConsole(
                "/getUsers error 401 =>",
                `Secret is not valid ${secret}`
            );
            return handleApiAuthError(res);
        }

        let users = null;

        if (userType !== undefined) {
            users = await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.role, userType));
        } else {
            users = await db.select().from(usersTable);
        }

        return res
            .status(200)
            .json(successHandler(users, "Users fetched successfully"));
    } catch (error) {
        logErrorToConsole("/getUsers error 500 =>", error);
        return handleApiRouteError(res, error);
    }
};

export const renewVisaManually = async (req: Request, res: Response) => {
    try {
        logToConsole("/renewVisaManually req.body", req.body);

        const bodyValidationResult = renewVisaManuallyBodyValidator.safeParse(
            req.body
        );

        if (!bodyValidationResult.success) {
            logErrorToConsole(
                "/renewVisaManually error 400 =>",
                bodyValidationResult.error
            );
            return handleApiClientError(res);
        }

        const { secret, userId } = bodyValidationResult.data;

        logToConsole(
            "/renewVisaManually body validated",
            bodyValidationResult.data
        );

        if (secret !== env.APP_SECRET) {
            logErrorToConsole(
                "/renewVisaManually error 401 =>",
                "Secret is not valid"
            );
            return handleApiAuthError(res);
        }

        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, userId));

        if (!user) {
            return handleApiClientError(res, "No user found!");
        }

        if (user.nftStatus === VISA_STATUS.ACTIVE) {
            return handleApiClientError(
                res,
                "User already has an active business visa!"
            );
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
            .where(eq(usersTable.id, userId));

        const emailId = await sendVisaRenewedEmail({
            to: user.email,
            subject: "Your business visa has been renewed!",
        });

        return res.status(200).json(
            successHandler(
                {
                    userId,
                    emailId,
                },
                "Business visa renewed successfully"
            )
        );
    } catch (error) {
        logErrorToConsole("/renewVisaManually error 500 =>", error);
        return handleApiRouteError(res, error);
    }
};

export const expireVisaManually = async (req: Request, res: Response) => {
    try {
        logToConsole("/expireVisaManually req.body", req.body);

        const bodyValidationResult = expireVisaManuallyBodyValidator.safeParse(
            req.body
        );

        if (!bodyValidationResult.success) {
            logErrorToConsole(
                "/expireVisaManually error 400 =>",
                bodyValidationResult.error
            );
            return handleApiClientError(res);
        }

        const { secret, userId } = bodyValidationResult.data;

        logToConsole(
            "/expireVisaManually body validated",
            bodyValidationResult.data
        );

        if (secret !== env.APP_SECRET) {
            logErrorToConsole(
                "/expireVisaManually error 401 =>",
                "Secret is not valid"
            );
            return handleApiAuthError(res);
        }

        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, userId));

        if (!user) {
            return handleApiClientError(res, "No user found!");
        }

        if (user.nftStatus === VISA_STATUS.EXPIRED) {
            return handleApiClientError(
                res,
                "User already has an expired business visa!"
            );
        }

        const bvImageUrl = await generateBusinessVisaImage({
            walletAddress: user.walletAddress,
            name: user.name ?? "Dean's List DAO Member",
            status: "Expired",
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
                    expiresAt: format(new Date(), "dd MMMM yyyy hh:mm a"),
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

        const emailId = await sendVisaExpiredEmail({
            to: user.email,
            subject: "Your business visa has been expired!",
        });

        return res.status(200).json(
            successHandler(
                {
                    emailId,
                    userId,
                },
                "Business visa expired successfully"
            )
        );
    } catch (error) {
        logErrorToConsole("/expireVisaManually error 500 =>", error);
        return handleApiRouteError(res, error);
    }
};

export const updateEarnings = async (req: Request, res: Response) => {
    try {
        logToConsole("/updateEarnings req.body", req.body);

        const bodyValidationResult = updateEarningsValidator.safeParse(
            req.body
        );

        if (!bodyValidationResult.success) {
            logErrorToConsole(
                "/updateEarnings error 400 =>",
                bodyValidationResult.error
            );
            return handleApiClientError(res);
        }

        const { wallets, secret } = bodyValidationResult.data;

        logToConsole(
            "/updateEarnings body validated",
            bodyValidationResult.data
        );

        if (secret !== env.APP_SECRET) {
            logErrorToConsole(
                "/updateEarnings error 401 =>",
                "Secret is not valid"
            );
            return handleApiAuthError(res);
        }

        const failedUpdateEarningsWallet = [];

        for (const holder of wallets) {
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
            }
        }

        if (failedUpdateEarningsWallet.length === wallets.length) {
            throw new Error("All earnings update failed!");
        }

        return res.status(200).json(
            successHandler(
                {
                    wallets,
                    failedUpdates: failedUpdateEarningsWallet,
                },
                "Earnings updated successfully!"
            )
        );
    } catch (error) {
        logErrorToConsole("/updateEarnings error 500 =>", error);
        return handleApiRouteError(res, error);
    }
};
