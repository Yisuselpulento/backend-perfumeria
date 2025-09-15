import express from "express";
import {
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderControllers.js";
import { verifyAuth } from "../../middlewares/verifyAuth.js";
import { isAdminMiddleware } from "../../middlewares/isAdminMiddleware.js";

const router = express.Router();

// ----------------- Rutas de usuario -----------------
router.get("/", verifyAuth, getUserOrders);      

// ----------------- Rutas de admin -----------------
router.get("/all", verifyAuth, isAdminMiddleware, getAllOrders);                
router.put("/:orderId/status", verifyAuth, isAdminMiddleware, updateOrderStatus);
router.delete("/:orderId", verifyAuth, isAdminMiddleware, deleteOrder);          

// ----------------- Orden específica (usuario/admin) -----------------
router.get("/:id", verifyAuth, getOrderById);
export default router;