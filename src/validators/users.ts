import { z } from "zod";
import USER_ROLES from "../constants/USER_ROLES.ts";

export const getUserQueryValidator = z.object({
    secret: z.string().nonempty(),
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
