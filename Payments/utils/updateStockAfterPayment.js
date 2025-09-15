import Product from "../../models/products.model.js";

export const updateStockAndStatus = async (order) => {
  try {
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const variant = product.variants.id(item.variantId);
      if (!variant) continue;

      // Reducir stock sin bajar de 0
      variant.stock = Math.max(0, variant.stock - item.quantity);

        // Aumentar el contador de ventas
      product.sold += item.quantity;


      // Actualizar status según la suma total de stock
      const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

      if (totalStock === 0) {
        product.status = "sin_stock";
      } else if (totalStock < 7) {
        product.status = "poco_stock";
      } else {
        product.status = "en_stock";
      }

      await product.save();
    }
  } catch (error) {
    console.error("Error actualizando stock y status:", error);
  }
};