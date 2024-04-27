import express from "express";
import {
    expireVisaManually,
    getUser,
    getUsers,
    renewVisaManually,
    updateEarnings,
} from "../../controllers/users.controller.js";

const router = express.Router();

router.get("/:walletAddress", getUser);
router.get("/", getUsers);
router.put("/renew", renewVisaManually);
router.put("/expire", expireVisaManually);
router.post("/earnings", updateEarnings);

export default router;
