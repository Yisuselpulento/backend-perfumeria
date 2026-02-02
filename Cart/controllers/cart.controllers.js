import Product from "../../models/products.model.js";

export const refreshCart = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Items inválidos" });
    }

    const refreshedItems = [];
    let total = 0;
    let changed = false;

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) continue;

      const variant = product.variants.id(item.variantId);
      if (!variant) continue;

      // Ajustar cantidad si no hay stock
      const quantity = Math.min(item.quantity, variant.stock);

      if (quantity !== item.quantity) changed = true;

      total += variant.price * quantity;

      refreshedItems.push({
        productId: product._id,
        variantId: variant._id,
        name: product.name,
        image: product.image,
        volume: variant.volume,
        price: variant.price,
        stock: variant.stock,
        quantity,
        available: variant.stock > 0
      });
    }

    res.json({
      items: refreshedItems,
      total,
      changed
    });

  } catch (error) {
    console.error("Error refresh cart:", error);
    res.status(500).json({ message: "Error al refrescar carrito" });
  }
};
