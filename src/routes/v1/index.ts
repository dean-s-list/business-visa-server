import express from "express";
import applicantsRoutes from "./applicants.route.js";
import usersRoutes from "./users.route.js";

const router = express.Router();

router.use("/applicants", applicantsRoutes);
router.use("/users", usersRoutes);

export default router;
