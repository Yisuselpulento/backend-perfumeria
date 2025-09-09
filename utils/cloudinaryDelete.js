import { v2 as cloudinary } from "cloudinary";

export const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes("res.cloudinary.com")) return;

  const parts = imageUrl.split("/");
  const fileName = parts.pop();
  const folder = parts[parts.length - 1];
  const publicId = `${folder}/${fileName.split(".")[0]}`;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Error eliminando de Cloudinary:", err);
  }
};