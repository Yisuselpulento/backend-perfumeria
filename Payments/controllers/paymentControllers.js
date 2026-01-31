import Product from "../../models/products.model.js";
import { User } from "../../models/user.model.js";
import { preferenceClient } from "../utils/mercadopago.js";

export const checkout = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user?.email) {
      return res.status(400).json({
        success: false,
        message: "Email del usuario no disponible",
      });
    }

    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron productos",
      });
    }

    if (
      !shippingAddress?.street ||
      !shippingAddress?.city ||
      !shippingAddress?.zip ||
      !shippingAddress?.state ||
      !shippingAddress?.phone
    ) {
      return res.status(400).json({
        success: false,
        message: "Dirección inválida",
      });
    }

    // Validar productos y stock
    const validatedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.id);
        if (!product) throw new Error("Producto no encontrado");

        const variant = product.variants.id(item.variant._id);
        if (!variant) throw new Error("Variante inválida");

        if (item.quantity > variant.stock) {
          throw new Error(`Stock insuficiente para ${product.name}`);
        }

        return {
          productId: product._id,
          variantId: variant._id,
          name: `${product.name} ${variant.volume}ml`,
          quantity: item.quantity,
          price: variant.price,
          volume: variant.volume,
        };
      })
    );

    const total = validatedItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    // 🔒 Crear preferencia sin crear orden todavía
    const preference = await preferenceClient.create({
      body: {
        items: validatedItems.map((item) => ({
          id: item.productId.toString(),
          title: item.name,
          quantity: item.quantity,
          unit_price: Number(item.price),
          currency_id: "CLP",
        })),
        payer: { email: user.email },
        metadata: {
          userId: userId.toString(),
          cart: JSON.stringify(validatedItems),
          shippingAddress: JSON.stringify(shippingAddress),
          total: total,
        },
        back_urls: {
          success: `${process.env.CLIENT_URL}/checkout/success`,
          failure: `${process.env.CLIENT_URL}/checkout/failure`,
          pending: `${process.env.CLIENT_URL}/checkout/pending`,
        },
        auto_return: "approved",
        notification_url: `${process.env.API_URL}/webhooks/mercadopago`,
      },
    });

    res.status(201).json({
      success: true,
      checkout_url: preference.init_point,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
