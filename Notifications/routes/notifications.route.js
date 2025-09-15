import express from "express";
import {
  getUserNotifications,
  markNotificationAsRead,
  getAllNotifications,
  createNotification,
  updateNotification,
  deleteNotification
} from "../controllers/notificationControllers.js";
import { verifyAuth } from "../../middlewares/verifyAuth.js";
import { isAdminMiddleware } from "../../middlewares/isAdminMiddleware.js";

const router = express.Router();

// ----------------- Usuario -----------------
router.get("/", verifyAuth, getUserNotifications);       
router.put("/:id/read", verifyAuth, markNotificationAsRead); 

// ----------------- Admin -----------------
router.get("/all", verifyAuth, isAdminMiddleware, getAllNotifications);
router.post("/", verifyAuth, isAdminMiddleware, createNotification);
router.put("/:id", verifyAuth, isAdminMiddleware, updateNotification);
router.delete("/:id", verifyAuth, isAdminMiddleware, deleteNotification);

export default router;