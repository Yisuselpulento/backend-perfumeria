import express from "express";
import { verifyAuth } from "../../middlewares/verifyAuth.js";
import { isAdminMiddleware } from "../../middlewares/isAdminMiddleware.js";

import {
  addReview,
  getProductReviews,
  approveReview,
  deleteReview,
  getPendingReviews,
} from "../controllers/reviewControllers.js";


const router = express.Router();

// Usuario autenticado puede agregar reseña
router.post("/", verifyAuth, addReview);

// Público - ver reseñas de un producto
router.get("/product/:productId", getProductReviews);

// Admin - aprobar, eliminar, listar pendientes
router.put("/approve/:reviewId", verifyAuth, isAdminMiddleware, approveReview);
router.delete("/:reviewId", verifyAuth, isAdminMiddleware, deleteReview);
router.get("/pending/all", verifyAuth, isAdminMiddleware, getPendingReviews);

export default router;