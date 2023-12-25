import express from "express";
import {
    acceptApplicant,
    getApplications,
    mintApplicantVisa,
    postApplication,
    renewVisa,
} from "../../controllers/applicants.controller.js";

const router = express.Router();

router.get("/", getApplications);
router.post("/", postApplication);
router.put("/", acceptApplicant);
router.post("/visa", mintApplicantVisa);
router.post("/renew", renewVisa);

export default router;
