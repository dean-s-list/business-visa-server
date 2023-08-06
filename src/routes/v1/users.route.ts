import express from "express";
import { getUser, getUsers } from "../../controllers/users.controller.js";

const router = express.Router();

router.get("/:walletAddress", getUser);
router.get("/", getUsers);

export default router;
