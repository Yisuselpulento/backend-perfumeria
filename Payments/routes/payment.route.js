import express from "express";
import { verifyAuth } from "../../middlewares/verifyAuth.js";
import { isAdminMiddleware } from "../../middlewares/isAdminMiddleware.js";
import {
  checkout,
  createPaymentIntent,
   failPayment,
  refundPayment
} from "../controllers/paymentControllers.js";


const router = express.Router();


router.post("/checkout", verifyAuth, checkout);

// Ruta para crear PaymentIntent
router.post("/create-intent", verifyAuth, createPaymentIntent);

router.post("/fail", verifyAuth, failPayment);                  // Marcar pago fallido
router.post("/refund", verifyAuth, refundPayment); // Reembolsar pago

export default router;