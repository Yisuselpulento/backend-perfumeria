import { v2 as cloudinary } from 'cloudinary';

export const uploadToCloudinary = (fileBuffer, folder = "default") => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    ).end(fileBuffer);
  });
};