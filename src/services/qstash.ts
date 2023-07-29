import { Client } from "@upstash/qstash";

import env from "../env/index.js";

import "isomorphic-fetch";

const qstashClient = new Client({
    token: env.QSTASH_TOKEN,
});

export default qstashClient;
