import Product from "../../models/products.model.js";
import { v2 as cloudinary } from "cloudinary";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const createProduct = async (req, res) => {
  try {
    const {
      name, description, brand, category, onSale, status, timeOfDay, seasons
    } = req.body;

    const variants = JSON.parse(req.body.variants || "[]");
    const ingredients = JSON.parse(req.body.ingredients || "[]");
    const tags = JSON.parse(req.body.tags || "[]");
    const parsedSeasons = JSON.parse(seasons || "[]");


    if (!name || !description || !brand || !category || !status  || !timeOfDay || !parsedSeasons.length) {
      return res.status(400).json({ success: false, message: "Todos los campos obligatorios deben estar completos" });
    }


    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ success: false, message: "Debe agregar al menos una variante" });
    }

    for (let variant of variants) {
      if (
        typeof variant.volume !== "number" ||
        typeof variant.price !== "number" ||
        typeof variant.stock !== "number"
      ) {
        return res.status(400).json({
          success: false,
          message: "Las variantes deben tener volumen, precio y stock como números",
        });
      }
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ success: false, message: "Debe agregar al menos un ingrediente" });
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ success: false, message: "Debe agregar al menos un tag" });
    }

    for (let tag of tags) {
      if (
        !tag.name ||
        typeof tag.name !== "string" ||
        typeof tag.intensity !== "number" ||
        tag.intensity < 1 ||
        tag.intensity > 10
      ) {
        return res.status(400).json({
          success: false,
          message: "Cada tag debe tener un nombre válido y una intensidad entre 1 y 10",
        });
      }
    }

     if (!["day", "night", "both"].includes(timeOfDay)) {
      return res.status(400).json({
        success: false,
        message: "'timeOfDay' debe ser 'day', 'night' o 'both'"
      });
    }

    if (
      !Array.isArray(parsedSeasons) ||
      !parsedSeasons.every(season =>
        ["summer", "fall", "winter", "spring"].includes(season)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "'seasons' debe ser un arreglo con estaciones válidas: summer, fall, winter, spring"
      });
    }

    if (!req.files || !req.files["productImage"] || !req.files["ingredientImages"]) {
      return res.status(400).json({ success: false, message: "Debe subir una imagen del producto e imágenes de ingredientes" });
    }

    const productImageFile = req.files["productImage"][0];
    const ingredientImageFiles = req.files["ingredientImages"];

    if (ingredientImageFiles.length !== ingredients.length) {
      return res.status(400).json({ success: false, message: "Cantidad de imágenes de ingredientes no coincide" });
    }

    const result = await uploadToCloudinary(productImageFile.buffer, "perfumes");

    const uploadedIngredientImages = await Promise.all(
      ingredientImageFiles.map((file) => uploadToCloudinary(file.buffer, "ingredientes"))
    );

    const enrichedIngredients = ingredients.map((ing, i) => ({
      name: ing.name,
      image: uploadedIngredientImages[i].secure_url,
    }));


    const product = new Product({
      name,
      description,
      brand,
      category,
      image: result.secure_url,
      onSale,
      status,
      timeOfDay,
      seasons: parsedSeasons,
      variants,
      ingredients: enrichedIngredients,
      tags,
    });

    await product.save();

    res.status(201).json({ success: true, message: "Producto creado", data: product });

  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().select("name brand image tags status variants");

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron productos disponibles",
      });
    }

    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      brand: product.brand,
      image: product.image,
      tags: product.tags,
      status: product.status,
      price: product.variants?.[0]?.price ?? null  
    }));

    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener productos: " + error.message,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
  
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }


    if (product.image && product.image.includes("res.cloudinary.com")) {
      try {
        const parts = product.image.split('/');
        const fileName = parts.pop();
        const folder = parts[parts.length - 1];
        const publicId = `${folder}/${fileName.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error("Error al eliminar imagen principal de Cloudinary:", error);
      }
    }

    if (Array.isArray(product.ingredients)) {
      for (const ing of product.ingredients) {
        if (ing.image && ing.image.includes("res.cloudinary.com")) {
          try {
            const parts = ing.image.split('/');
            const fileName = parts.pop();
            const folder = parts[parts.length - 1];
            const publicId = `${folder}/${fileName.split('.')[0]}`;
            await cloudinary.uploader.destroy(publicId);
          } catch (error) {
            console.error("Error al eliminar imagen de ingrediente de Cloudinary:", error);
          }
        }
      }
    }

    await product.deleteOne();

    res.status(200).json({ success: true, message: "Producto eliminado" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
