import express from "express";
import { sendDiscountBroadcast } from "../controllers/email.controllers.js";
import { verifyAuth } from "../../middlewares/verifyAuth.js";
import { isAdminMiddleware } from "../../middlewares/isAdminMiddleware.js";

const router = express.Router();

router.post(
  "/discount",
  verifyAuth,
  isAdminMiddleware,
  sendDiscountBroadcast
);

export default router;