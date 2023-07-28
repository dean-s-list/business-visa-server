import express from "express";
import { getUser } from "../../controllers/users.controller.js";

const router = express.Router();

router.get("/:walletAddress", getUser);

export default router;
