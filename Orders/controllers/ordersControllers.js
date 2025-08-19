import Order from "../../models/orders.model.js";
import Product from "../../models/products.model.js";

export const createOrder = async (req, res) => {
  try {
    const userId = req.userId; // viene del middleware verifyAuth
    const { items, shippingAddress, paymentInfo } = req.body;

    // Validaciones básicas
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron productos en la orden",
      });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.country) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar una dirección de envío válida",
      });
    }

    if (!paymentInfo || !paymentInfo.method) {
      return res.status(400).json({
        success: false,
        message: "Debe seleccionar un método de pago",
      });
    }

    // Validar que cada producto exista y obtener precio actual
    const validatedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.id);
        if (!product) {
          throw new Error(`Producto con ID ${item.id} no encontrado`);
        }
        const variant = product.variants.id(item.variant._id);
        if (!variant) {
          throw new Error(`Variante con ID ${item.variant._id} no encontrada para el producto ${product.name}`);
        }
        return {
          productId: product._id,
          variantId: variant._id,
          name: product.name,
          image: product.image,
          quantity: item.quantity,
          price: variant.price,
          volume: variant.volume
        };
      })
    );

    // Calcular total
    const total = validatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Crear la orden
    const newOrder = new Order({
      userId,
      items: validatedItems,
      total,
      status: "pending",
      paymentInfo: {
        method: paymentInfo.method,
        transactionId: paymentInfo.transactionId || null,
        paidAt: paymentInfo.paidAt || null,
      },
      shippingAddress,
    });

    await newOrder.save();

    return res.status(201).json({
      success: true,
      message: "Orden creada correctamente",
      data: newOrder,
    });

  } catch (error) {
    console.error("Error creando la orden:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al crear la orden",
    });
  }
};


export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener ordenes" });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate("userId", "email fullName");
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener ordenes" });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Orden no encontrada" });

    order.status = status;
    await order.save();

    res.json({ success: true, message: "Estado actualizado", data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al actualizar estado" });
  }
};

export const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Orden no encontrada" });
    }

    // Validación: usuario solo puede ver su propia orden, admin puede ver todas
    if (!req.isAdmin && order.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "No autorizado para ver esta orden" });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener la orden" });
  }
};