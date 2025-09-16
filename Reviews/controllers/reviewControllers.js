import { Review } from "../../models/review.model.js";
import Product from "../../models/products.model.js"; 
import Order from "../../models/orders.model.js"; 

export const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.userId; 

    // Verificar si el usuario compró el producto
    const order = await Order.findOne({
      userId,
      status: "delivered", // aseguramos que recibió el pedido
      "items.productId": productId,
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Solo puedes reseñar productos que hayas comprado y recibido.",
      });
    }

    // Crear reseña
    const review = new Review({
      userId,
      productId,
      rating,
      comment,
    });

    await review.save();

    res.json({
      success: true,
      message: "Reseña enviada y pendiente de aprobación.",
      data: review,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al crear reseña" });
  }
};

// 📌 Obtener reseñas de un producto (solo aprobadas)
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ productId, approved: true })
      .populate("userId", "fullName") // muestra el nombre del usuario
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener reseñas" });
  }
};

// 📌 Admin - aprobar reseña
export const approveReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { approved: true },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, message: "Reseña no encontrada" });
    }

    // Actualizar promedio de producto
    const approvedReviews = await Review.find({ productId: review.productId, approved: true });

    const numReviews = approvedReviews.length;
    const averageRating =
      approvedReviews.reduce((acc, r) => acc + r.rating, 0) / numReviews;

    await Product.findByIdAndUpdate(review.productId, {
      numReviews,
      averageRating,
    });

    res.json({ success: true, message: "Reseña aprobada", data: review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al aprobar reseña" });
  }
};

// 📌 Admin - eliminar reseña
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Reseña no encontrada" });
    }

    await Review.findByIdAndDelete(reviewId);

    // Recalcular promedio del producto
    const approvedReviews = await Review.find({ productId: review.productId, approved: true });

    const numReviews = approvedReviews.length;
    const averageRating =
      numReviews > 0
        ? approvedReviews.reduce((acc, r) => acc + r.rating, 0) / numReviews
        : 0;

    await Product.findByIdAndUpdate(review.productId, {
      numReviews,
      averageRating,
    });

    res.json({ success: true, message: "Reseña eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al eliminar reseña" });
  }
};

// 📌 Admin - listar todas las reseñas pendientes
export const getPendingReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ approved: false })
      .populate("userId", "fullName")
      .populate("productId", "name");

    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener reseñas pendientes" });
  }
};