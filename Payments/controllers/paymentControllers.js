import Order from "../../models/orders.model.js";
import Product from "../../models/products.model.js";
import { User } from "../../models/user.model.js";
import { preferenceClient } from "../utils/mercadopago.js";

const FREE_SHIPPING_THRESHOLD = 40000; 
const STANDARD_SHIPPING = 4500;

export const checkout = async (req, res) => {
  try {
    const userId = req.userId || null;
    const { items, shippingAddress, email, deliveryMethod } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requerido para el checkout",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron productos",
      });
    }

    if (!["shipping", "pickup"].includes(deliveryMethod)) {
      return res.status(400).json({
        success: false,
        message: "Método de entrega inválido",
      });
    }

    // Validación de datos de envío
    if (deliveryMethod === "shipping") {
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
    }

    if (deliveryMethod === "pickup") {
      if (!shippingAddress?.phone) {
        return res.status(400).json({
          success: false,
          message: "Ingresa un teléfono de contacto para retiro",
        });
      }

      // Rellenamos los campos fijos para pickup
      shippingAddress.street = "Retiro en persona";
      shippingAddress.city = "Los Andes";
      shippingAddress.state = "Valparaíso";
    }

    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no válido",
        });
      }
    }

    // Validación de productos y stock
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

    const subtotal = validatedItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    // 🚚 Envío gratis si supera el umbral
    let shippingCost =
      deliveryMethod === "shipping" && subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : deliveryMethod === "shipping"
        ? STANDARD_SHIPPING
        : 0;

    const total = subtotal + shippingCost;

    const order = await Order.create({
      userId,
      guestEmail: userId ? null : email,
      items: validatedItems,
      subtotal,
      shippingCost,
      total,
      delivery: {
        method: deliveryMethod,
        pickupLocation:
          deliveryMethod === "pickup" ? "Los Andes" : null,
      },
      shippingAddress,
      status: "pending",
      paymentInfo: { method: "mercadopago" },
    });

    const mpItems = validatedItems.map((item) => ({
      id: item.productId.toString(),
      title: item.name,
      quantity: item.quantity,
      unit_price: Number(item.price),
      currency_id: "CLP",
    }));

    if (deliveryMethod === "shipping" && shippingCost > 0) {
      mpItems.push({
        id: "shipping",
        title: "Envío a domicilio",
        quantity: 1,
        unit_price: STANDARD_SHIPPING,
        currency_id: "CLP",
      });
    }

    const preference = await preferenceClient.create({
      body: {
        items: mpItems,
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