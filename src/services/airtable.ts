import Airtable from "airtable";

import env from "../env/index.js";

const airtable = new Airtable({ apiKey: env.AIRTABLE_TOKEN });

export default airtable;
