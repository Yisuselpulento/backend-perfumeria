import Product from "../../models/products.model.js";
import { v2 as cloudinary } from "cloudinary";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload.js";
import { slugify } from "../../utils/slugify.js";
import { deleteFromCloudinary } from "../../utils/cloudinaryDelete.js";

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
      if (typeof variant.volume !== "number" || typeof variant.price !== "number" || typeof variant.stock !== "number") {
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

     if (!["día", "noche", "día_y_noche"].includes(timeOfDay)) {
      return res.status(400).json({
        success: false,
        message: "'timeOfDay' debe ser 'día', 'noche' o 'día_y_noche'"
      });
    }

    if (
      !Array.isArray(parsedSeasons) ||
      !parsedSeasons.every(season =>
        ['verano', 'otoño', 'invierno', 'primavera'].includes(season)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "'seasons' debe ser un arreglo con estaciones válidas: 'verano', 'otoño', 'invierno', 'primavera"
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

     let result;
    try {
      result = await uploadToCloudinary(productImageFile.buffer, "perfumes");
    } catch (error) {
      console.error("Error subiendo productImage:", error);
      return res.status(500).json({ success: false, message: "Error subiendo la imagen del producto" });
    }

    let uploadedIngredientImages;
    try {
      uploadedIngredientImages = await Promise.all(
        ingredientImageFiles.map((file) =>
          uploadToCloudinary(file.buffer, "ingredientes")
        )
      );
    } catch (error) {
      console.error("Error subiendo ingredientImages:", error);
      return res.status(500).json({ success: false, message: "Error subiendo imágenes de ingredientes" });
    }

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

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }

    const topProducts = await Product.find().sort({ sold: -1 }).limit(2).select("_id");

    const isTopSeller = topProducts.some(p => p._id.equals(product._id));

    res.status(200).json({ 
      success: true, 
      data: { ...product.toObject(), isTopSeller } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }

    if (!req.body.name || !req.body.variants || req.body.variants.length === 0) {
      return res.status(400).json({ success: false, message: "Faltan campos obligatorios" });
    }

    if (req.body.image && req.body.image !== product.image) {
      try {
        await deleteFromCloudinary(product.image); 
      } catch (err) {
        console.error("Error al eliminar imagen vieja:", err);
      }

      try {
        const uploaded = await cloudinary.uploader.upload(req.body.image, {
          folder: "products",
        });
        req.body.image = uploaded.secure_url;
      } catch (err) {
        return res.status(500).json({ success: false, message: "Error subiendo nueva imagen" });
      }
    }

     if (Array.isArray(ingredients) && req.files?.ingredientImages) {
      const updatedIngredients = await Promise.all(
        ingredients.map(async (ing, i) => {
          const oldIng = product.ingredients.find((p) => p._id.toString() === ing._id);
          let imageUrl = ing.image;

          if (req.files.ingredientImages[i]) {
            try {
              if (oldIng?.image) await deleteFromCloudinary(oldIng.image);

              const uploaded = await uploadToCloudinary(req.files.ingredientImages[i].buffer, "ingredients");
              imageUrl = uploaded.secure_url;
            } catch (err) {
              console.error("Error subiendo imagen de ingrediente:", err);
              throw new Error("Error subiendo imágenes de ingredientes");
            }
          }

          return {
            ...ing,
            image: imageUrl,
          };
        })
      );

      req.body.ingredients = updatedIngredients;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

    res.status(200).json({ success: true, message: "Producto actualizado correctamente", data: updated });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }

    try {
      await deleteFromCloudinary(product.image);
    } catch (error) {
      console.error("Error al eliminar imagen principal de Cloudinary:", error);
    }

    if (Array.isArray(product.ingredients)) {
      for (const ing of product.ingredients) {
        try {
          await deleteFromCloudinary(ing.image);
        } catch (error) {
          console.error("Error al eliminar imagen de ingrediente de Cloudinary:", error);
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

export const getBestSellingProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ sold: -1 }) 
      .limit(2)           
      .select("name brand image tags status variants sold");

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron productos más vendidos",
      });
    }

    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      brand: product.brand,
      variants: product.variants,
      image: product.image,
      tags: product.tags,
      status: product.status,
      sold: product.sold,
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
      message: "Error al obtener productos más vendidos: " + error.message,
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { q, filter_genero, filter_marcas, filter_tiempo, filter_temporada, filter_tags, orderby } = req.query;

    let query = {};


    if (q && q.trim().length >= 2) {
      query.name = { $regex: q, $options: "i" };
    }

    // 🎯 género
    if (filter_genero) {
      const generos = filter_genero.split(",").map(g => slugify(g.trim()));
      query.categorySlug = { $in: generos };
    }

    // 🎯 marcas
    if (filter_marcas) {
      const marcas = filter_marcas.split(",").map(m => slugify(m.trim()));
      query.brandSlug = { $in: marcas };
    }

    // 🎯 tiempo del día
    if (filter_tiempo) {
      const tiempos = filter_tiempo.split(",").map(t => slugify(t.trim()));
      query.timeOfDaySlug = { $in: tiempos };
    }

    // 🎯 temporada
    if (filter_temporada) {
      const temporadas = filter_temporada.split(",").map(s => slugify(s.trim()));
      query.seasonsSlug = { $in: temporadas };
    }

    // 🎯 tags
    if (filter_tags) {
      const tags = filter_tags.split(",").map(t => slugify(t.trim()));
      query["tags.slug"] = { $in: tags };
    }

    let sort = {};
    switch (orderby) {
      case "date":
        sort = { createdAt: -1 };
        break;
      case "sold":
        sort = { sold: -1 };
        break;
      case "price":
        sort = { "variants.0.price": 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .sort(sort)
      .select("name brand image variants category status sold tags");

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron productos.",
      });
    }

    const topProducts = await Product.find()
      .sort({ sold: -1 })
      .limit(2)
      .select("_id");

    const topProductIds = topProducts.map(p => p._id.toString());

    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      brand: product.brand,
      variants: product.variants,
      image: product.image,
      tags: product.tags,
      status: product.status,
      sold: product.sold,
      price: product.variants?.[0]?.price ?? null,
      isTopSeller: topProductIds.includes(product._id.toString())
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
