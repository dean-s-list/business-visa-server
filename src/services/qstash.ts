import { Client } from "@upstash/qstash";

import env from "../env/index.ts";

const qstashClient = new Client({
    token: env.QSTASH_TOKEN,
});

export default qstashClient;
