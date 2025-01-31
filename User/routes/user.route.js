import express from "express";
import { verifyAuth } from "../../middlewares/verifyAuth.js";
import { editUser } from "../controllers/user.controllers.js";

const router = express.Router();

router.put("/update-user", verifyAuth, editUser)

export default router