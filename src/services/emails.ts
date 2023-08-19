import axios from "axios";
import env from "../env/index.js";
import { type ApiResponseType } from "../types/index.js";
import { BUSINESS_VISA_PAYMENT_LINK_URL } from "../constants/SPHERE_PAY.js";
import { logErrorToConsole } from "../utils/general.js";

interface COMMON_EMAIL_PROPS {
    to: string;
    subject: string;
}

export const sendVisaAcceptedEmail = async ({
    to,
    subject,
    businessVisaImage,
    claimLink,
}: COMMON_EMAIL_PROPS & { businessVisaImage: string; claimLink: string }) => {
    try {
        const { data }: { data: ApiResponseType } = await axios.post(
            `${env.FRONTEND_API_URL}/emails/bv-accepted`,
            {
                to,
                subject,
                businessVisaImage,
                claimLink,
            },
            {
                headers: {
                    Authorization: env.APP_SECRET,
                },
            }
        );

        if (!data.success) {
            throw new Error("Error sending visa accepted email");
        }

        return data.result as string | null;
    } catch (error) {
        logErrorToConsole("sendVisaAcceptedEmail =>", error);
        return null;
    }
};

export const sendVisaClaimedEmail = async ({
    to,
    subject,
}: COMMON_EMAIL_PROPS) => {
    try {
        const { data }: { data: ApiResponseType } = await axios.post(
            `${env.FRONTEND_API_URL}/emails/bv-claimed`,
            {
                to,
                subject,
            },
            {
                headers: {
                    Authorization: env.APP_SECRET,
                },
            }
        );

        if (!data.success) {
            throw new Error("Error sending visa claimed email");
        }

        return data.result as string | null;
    } catch (error) {
        logErrorToConsole("sendVisaClaimedEmail =>", error);
        return null;
    }
};

export const sendVisaExpiredEmail = async ({
    to,
    subject,
}: COMMON_EMAIL_PROPS) => {
    try {
        const { data }: { data: ApiResponseType } = await axios.post(
            `${env.FRONTEND_API_URL}/emails/bv-expired`,
            {
                to,
                subject,
                paymentLink: BUSINESS_VISA_PAYMENT_LINK_URL,
            },
            {
                headers: {
                    Authorization: env.APP_SECRET,
                },
            }
        );

        if (!data.success) {
            throw new Error("Error sending visa expired email");
        }

        return data.result as string | null;
    } catch (error) {
        logErrorToConsole("sendVisaExpiredEmail =>", error);
        return null;
    }
};

export const sendVisaRenewedEmail = async ({
    to,
    subject,
}: COMMON_EMAIL_PROPS) => {
    try {
        const { data }: { data: ApiResponseType } = await axios.post(
            `${env.FRONTEND_API_URL}/emails/bv-renewed`,
            {
                to,
                subject,
            },
            {
                headers: {
                    Authorization: env.APP_SECRET,
                },
            }
        );

        if (!data.success) {
            throw new Error("Error sending visa renewed email");
        }

        return data.result as string | null;
    } catch (error) {
        logErrorToConsole("sendVisaRenewedEmail =>", error);
        return null;
    }
};
