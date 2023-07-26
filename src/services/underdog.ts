import axios from "axios";

import env from "../env/index.ts";

const underdogApiEndpoint =
    env.SOLANA_NETWORK === "mainnet-beta"
        ? "https://api.underdogprotocol.com"
        : "https://dev.underdogprotocol.com";

const underdogApiInstance = axios.create({
    baseURL: underdogApiEndpoint,
    headers: { Authorization: `Bearer ${env.UNDERDOG_API_KEY}` },
});

export default underdogApiInstance;
