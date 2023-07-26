import { z } from "zod";

export const acceptApplicantBodyValidator = z.object({
    secret: z.string().nonempty(),
    applicant: z.object({
        walletAddress: z.string().nonempty(),
        name: z.string().nonempty(),
        email: z.string().email(),
        discordId: z.string().nonempty(),
        country: z.string().nonempty(),
    }),
});

export type AcceptApplicantBodyValidatorType = z.infer<
    typeof acceptApplicantBodyValidator
>;
