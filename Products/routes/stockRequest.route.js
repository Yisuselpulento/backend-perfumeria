import express from "express";
import { verifyAuth } from "../../middlewares/verifyAuth.js";
import { isAdminMiddleware } from "../../middlewares/isAdminMiddleware.js";

import {
  requestOutOfStockProduct,
  getAllStockRequests,
  updateStockRequestStatus,
  deleteStockRequest,
} from "../controllers/stockRequestControllers.js";

const router = express.Router();

/**
 * USER
 * Solicitar producto sin stock
 */
router.post(
  "/",
  verifyAuth,
  requestOutOfStockProduct
);

/**
 * ADMIN
 * Ver todas las solicitudes
 */
router.get(
  "/",
  verifyAuth,
  isAdminMiddleware,
  getAllStockRequests
);

/**
 * ADMIN
 * Cambiar estado de la solicitud
 */
router.put(
  "/:id",
  verifyAuth,
  isAdminMiddleware,
  updateStockRequestStatus
);

/**
 * ADMIN
 * Eliminar solicitud
 */
router.delete(
  "/:id",
  verifyAuth,
  isAdminMiddleware,
  deleteStockRequest
);

export default router;
