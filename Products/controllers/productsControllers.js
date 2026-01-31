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
    // 1️⃣ Parsear arrays enviados como JSON
    let variants = [], ingredients = [], tags = [], parsedSeasons = [];
    try {
      variants = JSON.parse(req.body.variants || "[]");
      ingredients = JSON.parse(req.body.ingredients || "[]");
      tags = JSON.parse(req.body.tags || "[]");
      parsedSeasons = JSON.parse(req.body.seasons || "[]");
    } catch {
      return res.status(400).json({
        success: false,
        message: "Formato JSON inválido"
      });
    }

    const { name, description, brand, category, onSale, status, timeOfDay } = req.body;

    // 2️⃣ Validación completa
    const { isValid, message } = validateProductData({
      name,
      description,
      brand,
      category,
      status,
      timeOfDay,
      seasons: parsedSeasons,
      variants,
      ingredients,
      tags
    });

    if (!isValid) {
      return res.status(400).json({ success: false, message });
    }

    // 3️⃣ Imagen (opcional)
    let productImage;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "products");
      productImage = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }
    // si NO hay imagen, NO hacemos nada → usa default del schema

    // 4️⃣ Crear producto
    const product = new Product({
      name,
      description,
      brand,
      category,
      onSale,
      status,
      timeOfDay,
      seasons: parsedSeasons,
      variants,
      ingredients,
      tags,
      ...(productImage && { image: productImage }) // 👈 clave
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Producto creado",
      data: product
    });

  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};


export const updateProduct = async (req, res) => {
  try {
    // 1️⃣ Buscar el producto
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Producto no encontrado" });
    }

    // 2️⃣ Validación parcial usando helper
    const {
      name,
      description,
      brand,
      variants,
      category,
      onSale,
      status,
      timeOfDay,
      seasons,
      tags,
      ingredients
    } = req.body;

    // Convertir campos JSON si vienen como string
    const parsedVariants = variants ? JSON.parse(variants) : undefined;
    const parsedSeasons = seasons ? JSON.parse(seasons) : undefined;
    const parsedTags = tags ? JSON.parse(tags) : undefined;
    const parsedIngredients = ingredients ? JSON.parse(ingredients) : undefined;

    const { isValid, message } = validateProductData(
      {
        name,
        description,
        brand,
        category,
        status,
        timeOfDay,
        seasons: parsedSeasons,
        variants: parsedVariants,
        ingredients: parsedIngredients,
        tags: parsedTags
      },
      { partial: true } // Validación parcial para update
    );
    if (!isValid) return res.status(400).json({ success: false, message });

    // 3️⃣ Actualizar campos de texto y arrays directamente
    const fields = {
      name,
      description,
      brand,
      variants: parsedVariants,
      category,
      onSale,
      status,
      timeOfDay,
      seasons: parsedSeasons,
      tags: parsedTags,
      ingredients: parsedIngredients
    };
    for (const key in fields) {
      if (fields[key] !== undefined) {
        product[key] = fields[key];
      }
    }

    // 4️⃣ Actualizar imagen principal si viene nueva
    if (req.files?.productImage?.[0]) {
      try {
        // Borrar la imagen anterior si existe
        if (product.image?.publicId) await deleteFromCloudinary(product.image);
        // Subir nueva imagen
        const result = await uploadToCloudinary(req.files.productImage[0].buffer, "products");
        product.image = { url: result.secure_url, publicId: result.public_id };
      } catch (err) {
        console.error("Error subiendo nueva imagen principal:", err);
        return res.status(500).json({ success: false, message: "Error subiendo la nueva imagen del producto" });
      }
    }

    // 6️⃣ Guardar cambios en DB
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

  if (product.image?.publicId) {
      try {
        await deleteFromCloudinary(product.image);
      } catch (err) {
        console.error("Error al eliminar imagen del producto en Cloudinary:", err);
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