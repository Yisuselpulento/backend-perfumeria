import { v2 as cloudinary } from "cloudinary";

export const deleteFromCloudinary = async (image) => {
  if (!image) return;

   if (typeof image === "object" && image.publicId) {
    try {
      await cloudinary.uploader.destroy(image.publicId);
    } catch (err) {
      console.error("Error eliminando de Cloudinary:", err);
    }
    return;
  }

  if (typeof image === "string" && image.includes("res.cloudinary.com")) {
    const parts = image.split("/");
    const fileName = parts.pop();
    const folder = parts[parts.length - 1];
    const publicId = `${folder}/${fileName.split(".")[0]}`;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error("Error eliminando de Cloudinary:", err);
    }
  }
};