import { logErrorToConsole } from "../utils/general.js";
import type { Request, Response } from "express";
import {
    handleApiAuthError,
    handleApiClientError,
    handleApiRouteError,
    successHandler,
} from "../utils/api.js";
import db from "../db/index.js";
import { usersTable } from "../db/schema/index.js";
import env from "../env/index.js";
import { getUserQueryValidator } from "../validators/users.js";
import { and, eq } from "drizzle-orm";

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
