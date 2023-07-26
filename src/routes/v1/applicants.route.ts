import express from "express";
import {
    acceptApplicant,
    mintApplicantVisa,
} from "../../controllers/applicants.controller.ts";

const router = express.Router();

router.post("/", acceptApplicant);
router.post("/visa", mintApplicantVisa);

export default router;
