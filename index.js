import express from "express"
import { connectDB } from "./db/connectDB.js";
import dotenv from "dotenv" 
import authRoutes from "./Auth/routes/auth.route.js"
import userRoutes from "./User/routes/user.route.js"
import adminRoutes from "./Admin/routes/admin.route.js"

import cookieParser from "cookie-parser";
import cors from "cors"

 dotenv.config() 

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", authRoutes)
app.use("/api/user", userRoutes)
app.use("/api/admin", adminRoutes)

app.listen(PORT,()=> {
    connectDB()
    console.log(`Servidor corriendo en el puerto ${PORT}`)
})



