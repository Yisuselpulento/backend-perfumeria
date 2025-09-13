import Product from "../../models/products.model.js";

export const getTopProducts = async (limit = 2) => {
  const topProducts = await Product.find()
    .sort({ sold: -1 })
    .limit(limit)
    .select("_id");
  return topProducts.map(p => p._id.toString());
};

