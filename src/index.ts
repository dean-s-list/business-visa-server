import app from "./app.js";
import autoApproveApplicationsJob from "./crons/autoApproveApplications.js";
import verifyClaimStatusJob from "./crons/verifyClaimStatus.js";
import verifyExpireStatusJob from "./crons/verifyExpireStatus.js";
import env from "./env/index.js";
import { logToConsole } from "./utils/general.js";

const port = env.PORT;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);

    verifyClaimStatusJob.start();
    logToConsole(
        "Scheduled job to verify claim status which run every 5 minutes"
    );

    verifyExpireStatusJob.start();
    logToConsole(
        "Scheduled job to verify expire status which run every 10 minutes"
    );

    if (env.AUTO_APPROVE_APPLICATIONS) {
        autoApproveApplicationsJob.start();
        logToConsole(
            "Scheduled job to approve all applications which run every 10 minute"
        );
    } else {
        autoApproveApplicationsJob.stop();
    }
});
