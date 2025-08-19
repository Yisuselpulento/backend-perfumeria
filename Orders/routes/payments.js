import express from "express";
import Stripe from "stripe";
import { verifyAuth } from "../../middlewares/verifyAuth.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); 


router.post("/create-intent", verifyAuth, async (req, res) => {
  const { total } = req.body; 
  if (!total || total <= 0) {
    return res.status(400).json({ success: false, message: "Monto inválido" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "clp",
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creando PaymentIntent:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;