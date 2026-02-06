import Order from "../../models/orders.model.js";
import Product from "../../models/products.model.js";
import { User } from "../../models/user.model.js";
import { preferenceClient } from "../utils/mercadopago.js";

export const checkout = async (req, res) => {
  try {
    // 🔹 Puede venir o no (guest)
    const userId = req.userId || null;

    const { items, shippingAddress, email } = req.body;

    // 🔹 Email obligatorio SIEMPRE
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requerido para el checkout",
      });
    }

    // 🔹 Validar items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron productos",
      });
    }

    // 🔹 Validar dirección
    if (
      !shippingAddress?.street ||
      !shippingAddress?.city ||
      !shippingAddress?.state ||
      !shippingAddress?.phone
    ) {
      return res.status(400).json({
        success: false,
        message: "Dirección inválida",
      });
    }

    // 🔹 Si hay userId, validamos que exista
    let user = null;
    if (userId) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no válido",
        });
      }
    }

    // 🔹 Validar productos y stock
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

    // 🔹 Crear orden (user o guest)
    const order = await Order.create({
      userId, // null si es guest
      guestEmail: userId ? null : email,
      items: validatedItems,
      total,
      status: "pending",
      paymentInfo: { method: "mercadopago" },
      shippingAddress,
    });

    // 🔹 Crear preferencia MercadoPago
    const preference = await preferenceClient.create({
      body: {
        items: validatedItems.map((item) => ({
          id: item.productId.toString(),
          title: item.name,
          quantity: item.quantity,
          unit_price: Number(item.price),
          currency_id: "CLP",
        })),
        payer: { email },
        metadata: {
          orderId: order._id.toString(),
          guest: !userId,
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

    return res.status(201).json({
      success: true,
      orderId: order._id,
      checkout_url: preference.init_point,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error en checkout",
    });
  }
};