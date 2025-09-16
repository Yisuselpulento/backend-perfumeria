import express from "express"
import { connectDB } from "./db/connectDB.js";
import dotenv from "dotenv" 
import authRoutes from "./Auth/routes/auth.route.js"
import adminRoutes from "./Admin/routes/admin.route.js"
import productsRoutes from "./Products/routes/products.route.js"
import paymentRoutes from "./Payments/routes/payment.route.js";
import userRoutes from "./User/routes/user.route.js"
import orderRoutes from "./Orders/routes/orders.route.js";
import notificationRoutes from "./Notifications/routes/notifications.route.js";
import reviewRoutes from "./Reviews/routes/reviews.route.js";

import cookieParser from "cookie-parser";
import cors from "cors"

 dotenv.config() 

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/products", productsRoutes)
app.use("/api/payments", paymentRoutes);
app.use("/api/user", userRoutes);
app.use("/api/orders", orderRoutes);            
app.use("/api/notifications", notificationRoutes); 
app.use("/api/reviews", reviewRoutes);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error al conectar con MongoDB:", err);
    process.exit(1);
  });

  // Capturar errores que no se lanzan dentro de promesas
process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Unhandled Rejection:", reason);
});


process.on("uncaughtException", (err) => {
  console.error("💀 Uncaught Exception:", err);
});