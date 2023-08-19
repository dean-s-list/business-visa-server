import axios from "axios";
import env from "../env/index.js";
import { getImageKitRootFolder, uploadImage } from "./image-kit.js";
import { logErrorToConsole } from "../utils/general.js";

export const generateBusinessVisaImage = async ({
    walletAddress,
    name,
    status,
    earnings,
}: {
    walletAddress: string;
    name: string;
    status: "Active" | "Expired";
    earnings: string;
}) => {
    try {
        const bvImageGenerationUrl = new URL(
            `${env.FRONTEND_API_URL}/generate-bv`
        );

        bvImageGenerationUrl.searchParams.append("name", name);

        bvImageGenerationUrl.searchParams.append("status", status);

        bvImageGenerationUrl.searchParams.append("earnings", earnings);

        bvImageGenerationUrl.searchParams.append("secret", env.APP_SECRET);

        const response = await axios.get(bvImageGenerationUrl.toString(), {
            responseEncoding: "base64",
        });

        const imageBase64 = response.data;

        if (!imageBase64) {
            throw new Error(
                "No image data returned from BV generation service"
            );
        }

        const imageUploadResponse = await uploadImage({
            file: imageBase64,
            fileName: `${walletAddress}.png`,
            folder: `${getImageKitRootFolder()}/business-visas`,
        });

        return imageUploadResponse.url;
    } catch (error) {
        logErrorToConsole("generateBusinessVisaImage =>", error);
        return null;
    }
};
