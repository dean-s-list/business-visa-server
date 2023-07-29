import { PublicKey } from "@solana/web3.js";
import { logErrorToConsole } from "./general.js";

export const isValidSolanaAddress = (address: string) => {
    try {
        const pubKey = new PublicKey(address);

        if (!pubKey) {
            return false;
        }

        return true;
    } catch (error) {
        logErrorToConsole("isValidSolanaAddress =>", error);
        return false;
    }
};
