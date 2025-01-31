import express from "express";
import { isAdminMiddleware } from "../../middlewares/isAdminMiddleware.js";
import { profileAdmin } from "../controllers/adminController.js";
import { verifyAuth } from "../../middlewares/verifyAuth.js";


const router = express.Router();

router.get("/", verifyAuth, isAdminMiddleware,  profileAdmin);


export default router