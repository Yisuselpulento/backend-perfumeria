import express from "express";
import { verifyAuth } from "../../middlewares/verifyAuth.js";
import { checkout } from "../controllers/paymentControllers.js";

const router = express.Router();

// Crear checkout Vexor
router.post("/checkout", checkout);

export default router;
