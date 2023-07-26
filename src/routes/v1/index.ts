import express from "express";
import applicantsRoutes from "./applicants.route.ts";
import usersRoutes from "./users.route.ts";

const router = express.Router();

router.use("/applicants", applicantsRoutes);
router.use("/users", usersRoutes);

export default router;
