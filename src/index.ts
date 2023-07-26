import app from "./app.ts";
import verifyClaimStatusJob from "./crons/verifyClaimStatus.ts";
import verifyExpireStatusJob from "./crons/verifyExpireStatus.ts";
import env from "./env/index.ts";
import { logToConsole } from "./utils/general.ts";

const port = env.PORT;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);

    verifyClaimStatusJob.start();
    logToConsole(
        "Scheduled job to verify claim status which run every 15 minutes"
    );

    verifyExpireStatusJob.start();
    logToConsole(
        "Scheduled job to verify expire status which run every 15 minutes"
    );
});
