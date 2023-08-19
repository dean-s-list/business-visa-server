import ImageKit from "imagekit";

import env from "../env/index.js";

const imagekit = new ImageKit({
    publicKey: env.IMAGEKIT_API_KEY,
    privateKey: env.IMAGEKIT_API_SECRET,
    urlEndpoint: env.IMAGEKIT_URL,
});

export const getImageKitRootFolder = () => {
    if (env.IMAGEKIT_ENV === "prod") {
        return "prod";
    }

    return "dev";
};

export const uploadImage = async ({
    file,
    fileName,
    folder,
    customMetadata = {},
}: {
    file: string;
    fileName: string;
    folder: string;
    customMetadata?: { [key: string]: any };
}) => {
    const uploadedImage = await imagekit.upload({
        file,
        fileName,
        folder,
        customMetadata,
        overwriteFile: true,
        useUniqueFileName: false,
    });

    await imagekit.purgeCache(uploadedImage.url);

    return uploadedImage;
};

export const deleteImage = async ({
    imageId,
    walletAddress,
}: {
    imageId: string;
    walletAddress: string;
}) => {
    const imageDetails = await imagekit.getFileDetails(imageId);

    const customMetadata: any = imageDetails.customMetadata;

    if (customMetadata?.walletAddress !== walletAddress) {
        throw new Error("You are not authorized to delete this image!");
    }

    await imagekit.deleteFile(imageId);

    return true;
};
