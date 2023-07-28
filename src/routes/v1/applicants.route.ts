import express from "express";
import {
    acceptApplicant,
    mintApplicantVisa,
    renewVisa,
} from "../../controllers/applicants.controller.js";

const router = express.Router();

router.post("/", acceptApplicant);
router.post("/visa", mintApplicantVisa);
router.post("/renew", renewVisa);

export default router;
