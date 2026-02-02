import express from "express";
import { refreshCart } from "../controllers/cart.controllers.js";

const router = express.Router();

// 🔁 Refrescar carrito (precios + stock reales)
router.post("/refresh", refreshCart);

export default router;
