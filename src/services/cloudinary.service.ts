import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { env } from '../config/env';

// https://collection.cloudinary.com/dtyqjsffk/756559e9158142bd6bc6ad43d00def64

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});


export const uploadToCloudinary = async (file: Express.Multer.File): Promise<any> => {
  return new Promise((resolve, reject) => {
      if (!file || !file.buffer) {
        return reject(new Error("No file buffer provided"));
      }

      const cld_upload_stream = cloudinary.uploader.upload_stream(
        {
          folder: "media",
          resource_type: "auto" // Auto-detects image/video/raw
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            return reject(error);
          }
          resolve(result);
        }
      );
      Readable.from(file.buffer).pipe(cld_upload_stream);
    });
};

