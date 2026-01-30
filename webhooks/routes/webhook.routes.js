import express from "express";
import { mercadopagoWebhook } from "../mercadopago.webhook.js";

const router = express.Router();

router.post("/mercadopago", mercadopagoWebhook);

export default router;
