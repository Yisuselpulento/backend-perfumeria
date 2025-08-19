import Product from "../models/products.model.js";

export const updateStockAfterPayment = async (order) => {
  try {
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const variant = product.variants.id(item.variantId);
      if (!variant) continue;

      variant.stock = Math.max(0, variant.stock - item.quantity);
      await product.save();
    }
  } catch (error) {
    console.error("Error actualizando stock:", error);
  }
};