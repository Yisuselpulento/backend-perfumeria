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

router.post("/", verifyAuth, isAdminMiddleware, upload.fields([
    { name: "productImage", maxCount: 1 },
    { name: "ingredientImages", maxCount: 10 },
  ]), createProduct);
router.put(
  "/:id",
  verifyAuth,
  isAdminMiddleware,
  upload.fields([
    { name: "productImage", maxCount: 1 },
    { name: "ingredientImages", maxCount: 10 }
  ]),
  updateProduct
);
router.delete("/:id", verifyAuth, isAdminMiddleware, deleteProduct);

router.get("/", getProducts);
router.get("/bestsellers", getBestSellingProducts);
router.get("/:id", getProductById);

export default router