import { z } from "zod";
import USER_ROLES from "../constants/USER_ROLES.js";

export const getUserQueryValidator = z.object({
    secret: z.string().min(1),
    userType: z
        .union([
            z.literal(USER_ROLES["MASTER-ADMIN"]),
            z.literal(USER_ROLES.ADMIN),
            z.literal(USER_ROLES.CLIENT),
            z.literal(USER_ROLES.USER),
        ])
        .optional(),
});

export type getUserQueryValidatorType = z.infer<typeof getUserQueryValidator>;

export const updateEarningsValidator = z.object({
    secret: z.string().min(1),
    wallets: z.array(
        z.object({
            wallet: z.string().min(1).max(44),
            earnings: z.number().min(0),
        })
    ),
});

export type UpdateApplicantType = z.infer<typeof updateEarningsValidator>;
