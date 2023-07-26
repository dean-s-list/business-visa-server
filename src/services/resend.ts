import { Resend } from "resend";

import env from "../env/index.ts";

const resend = new Resend(env.RESEND_API_KEY);

export default resend;
