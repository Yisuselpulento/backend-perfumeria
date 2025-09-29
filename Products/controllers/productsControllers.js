import Product from "../../models/products.model.js";
import { v2 as cloudinary } from "cloudinary";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload.js";
import { slugify } from "../../utils/slugify.js";
import { deleteFromCloudinary } from "../../utils/cloudinaryDelete.js";
import { validateProductData } from "../utils/validateProductData.js";
import { getTopProducts } from "../utils/getTopProducts.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const createProduct = async (req, res) => {
  try {

    let variants = [], ingredients = [], tags = [], parsedSeasons = [];
    try {
      variants = JSON.parse(req.body.variants || "[]");
      ingredients = JSON.parse(req.body.ingredients || "[]");
      tags = JSON.parse(req.body.tags || "[]");
      parsedSeasons = JSON.parse(req.body.seasons || "[]");
    } catch (e) {
      return res.status(400).json({ success: false, message: "Formato JSON inválido" });
    }

    const { name, description, brand, category, onSale, status, timeOfDay } = req.body;

    // ------------------- VALIDACIÓN DE DATOS -------------------
    const { isValid, message } = validateProductData({
      name, description, brand, category, status, timeOfDay,
      seasons: parsedSeasons, variants, ingredients, tags
    });
    if (!isValid) return res.status(400).json({ success: false, message });

    // ------------------- VALIDAR IMÁGENES -------------------
    if (!req.files?.productImage || !req.files?.ingredientImages) {
      return res.status(400).json({ success: false, message: "Debe subir una imagen del producto e imágenes de ingredientes" });
    }
    if (req.files.ingredientImages.length !== ingredients.length) {
      return res.status(400).json({ success: false, message: "Cantidad de imágenes de ingredientes no coincide" });
    }

    // ------------------- SUBIR IMÁGENES -------------------
    let productImage;
    try {
      const result = await uploadToCloudinary(req.files.productImage[0].buffer, "products");
      productImage = {
        url: result.secure_url,
        publicId: result.public_id
      };
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error subiendo imagen del producto" });
    }

    let uploadedIngredientImages;
    try {
      uploadedIngredientImages = await Promise.all(
        req.files.ingredientImages.map(file => uploadToCloudinary(file.buffer, "ingredients"))
      );
    } catch (error) {
      if (productImage?.publicId) await deleteFromCloudinary(productImage.publicId);
      return res.status(500).json({ success: false, message: "Error subiendo imágenes de ingredientes" });
    }

    const enrichedIngredients = ingredients.map((ing, i) => ({
      name: ing.name,
      image: {
        url: uploadedIngredientImages[i].secure_url,
        publicId: uploadedIngredientImages[i].public_id
      }
    }));

    const product = new Product({
      name,
      description,
      brand,
      category,
      image: productImage,
      onSale,
      status,
      timeOfDay,
      seasons: parsedSeasons,
      variants,
      ingredients: enrichedIngredients,
      tags
    });

    await product.save();

    res.status(201).json({ success: true, message: "Producto creado", data: product });

  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }

    // ------------------- CAMPOS DE TEXTO -------------------
    const fields = [
      "name", "description", "brand", "variants", "category",
      "onSale", "status", "timeOfDay", "seasons", "tags"
    ];
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    // ------------------- IMAGEN PRINCIPAL -------------------
    if (req.files?.productImage?.[0]) {
      try {
        // Borrar la anterior si existe
        if (product.image?.publicId) {
          await deleteFromCloudinary(product.image);
        }

        // Subir nueva
        const result = await uploadToCloudinary(req.files.productImage[0].buffer, "products");
        product.image = {
          url: result.secure_url,
          publicId: result.public_id
        };
      } catch (err) {
        console.error("Error subiendo nueva imagen principal:", err);
        return res.status(500).json({ success: false, message: "Error subiendo la nueva imagen del producto" });
      }
    }

    // ------------------- INGREDIENTES -------------------
    if (req.body.ingredients) {
      try {
        const ingredients = JSON.parse(req.body.ingredients);

        // Borrar imágenes viejas
        if (product.ingredients?.length) {
          await Promise.all(
            product.ingredients.map(i =>
              i.image ? deleteFromCloudinary(i.image).catch(() => {}) : null
            )
          );
        }

        // Subir nuevas imágenes
        const uploadedIngredients = await Promise.all(
          ingredients.map(async (ing, idx) => {
            if (req.files?.[`ingredientImage_${idx}`]?.[0]) {
              const result = await uploadToCloudinary(req.files[`ingredientImage_${idx}`][0].buffer, "ingredients");
              return {
                name: ing.name,
                image: { url: result.secure_url, publicId: result.public_id }
              };
            }
            return ing; // si no manda imagen, se guarda lo que viene del body
          })
        );

        product.ingredients = uploadedIngredients;
      } catch (err) {
        console.error("Error procesando ingredientes:", err);
        return res.status(400).json({ success: false, message: "Error procesando ingredientes" });
      }
    }

    // ------------------- GUARDAR CAMBIOS -------------------
    await product.save();
    res.status(200).json({ success: true, product });

  } catch (error) {
    console.error("Error en updateProduct:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }

   const imagesToDelete = [product.image, ...(product.ingredients?.map(i => i.image) || [])];
    await Promise.all(imagesToDelete.map(img => deleteFromCloudinary(img).catch(err => console.error(err))));

    await product.deleteOne();

    res.status(200).json({ success: true, message: "Producto eliminado" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBestSellingProducts = async (req, res) => {
  try {
     const topProductIds = await getTopProducts(2);

      const products = await Product.find({ _id: { $in: topProductIds } })
      .select("name brand image tags status variants sold onSale");

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
      onSale: product.onSale,
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
    const { q, filter_genero, filter_marcas, filter_tiempo, filter_temporada, filter_tags, page = 1, orderby , minPrice, maxPrice, } = req.query;

    const limit = 10; 
    const skip = (parseInt(page) - 1) * limit;

    let query = {};

    if (q?.trim().length >= 2) query.name = { $regex: q, $options: "i" };
    if (filter_genero) query.categorySlug = { $in: filter_genero.split(",").map(s => slugify(s.trim())) };
    if (filter_marcas) query.brandSlug = { $in: filter_marcas.split(",").map(s => slugify(s.trim())) };
    if (filter_tiempo) query.timeOfDaySlug = { $in: filter_tiempo.split(",").map(s => slugify(s.trim())) };
    if (filter_temporada) query.seasonsSlug = { $in: filter_temporada.split(",").map(s => slugify(s.trim())) };
    if (filter_tags) query["tags.slug"] = { $in: filter_tags.split(",").map(s => slugify(s.trim())) };

    if (minPrice || maxPrice) {
      query["variants.0.price"] = {};
      if (minPrice) query["variants.0.price"].$gte = parseFloat(minPrice);
      if (maxPrice) query["variants.0.price"].$lte = parseFloat(maxPrice);
    }

    let sort = {};
      switch (orderby) {
          case "date":
            sort = { createdAt: -1 };
            break;
          case "sold":
            sort = { sold: -1 };
            break;
          case "price_asc":
            sort = { "variants.0.price": 1 };
            break;
          case "price_desc":
            sort = { "variants.0.price": -1 };
            break;
          default:
            sort = { createdAt: -1 };
    }

     const topProductIds = await getTopProducts(2);

     const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select("name brand description image variants status sold tags onSale timeOfDay seasons category ingredients");

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron productos.",
      });
    }


    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      brand: product.brand,
      variants: product.variants,
      description: product.description,
      ingredients: product.ingredients,
      category: product.category,
      seasons: product.seasons,
      onSale: product.onSale,
      timeOfDay: product.timeOfDay,
      image: product.image,
      tags: product.tags,
      status: product.status,
      sold: product.sold,
      price: product.variants?.[0]?.price ?? null,
      isTopSeller: topProductIds.includes(product._id.toString())
    }));

     const totalCount = await Product.countDocuments(query);
     const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      page: parseInt(page),
      totalPages,
      totalCount,
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

     const topProductIds = await getTopProducts();

     const isTopSeller = topProductIds.includes(product._id.toString());

    res.status(200).json({ 
      success: true, 
      data: { ...product.toObject(), isTopSeller } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};