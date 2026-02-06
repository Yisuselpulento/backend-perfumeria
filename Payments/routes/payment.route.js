import express from "express";
import { checkout } from "../controllers/paymentControllers.js";
import { optionalAuth } from "../../middlewares/optionalAuth.js";

const router = express.Router();

// Crear checkout Vexor
router.post("/checkout", optionalAuth, checkout);

export default router;
