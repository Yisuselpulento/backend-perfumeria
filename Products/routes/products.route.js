import express from "express";
import { verifyAuth } from "../../middlewares/verifyAuth.js";
import { upload } from "../../middlewares/multer.js";
import { isAdminMiddleware } from "../../middlewares/isAdminMiddleware.js";
import {
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    getBestSellingProducts,
    getProducts
  } from "../controllers/productsControllers.js";

const router = express.Router();

router.post("/", verifyAuth, isAdminMiddleware, upload.single("productImage"), createProduct);
router.put(
  "/:id",
  verifyAuth,
  isAdminMiddleware,
  upload.single("productImage"),
  updateProduct
);
router.delete("/:id", verifyAuth, isAdminMiddleware, deleteProduct);

router.get("/", getProducts);
router.get("/bestsellers", getBestSellingProducts);
router.get("/:id", getProductById);

export default router