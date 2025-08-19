import express from "express";
import { verifyAuth } from "../../middlewares/verifyAuth.js";
import { isAdminMiddleware } from "../../middlewares/isAdminMiddleware.js";
import {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById 
} from "../controllers/ordersControllers.js";


const router = express.Router();

// Crear orden
router.post("/checkout", verifyAuth, createOrder);

// Obtener ordenes de un usuario
router.get("/my-orders", verifyAuth, getUserOrders);

// GET /orders/:id
router.get("/:id", verifyAuth, getOrderById);

// Obtener todas las ordenes (admin)
router.get("/", verifyAuth, isAdminMiddleware, getAllOrders);

// Actualizar estado de la orden (admin)
router.patch("/:orderId/status", verifyAuth, isAdminMiddleware, updateOrderStatus);

export default router;