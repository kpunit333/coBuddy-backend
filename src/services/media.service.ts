import { uploadToCloudinary } from './cloudinary.service';

export const uploadMedia = async (file: Express.Multer.File): Promise<any> => {
  try {
    const res = await uploadToCloudinary(file);
    return {
      success: true,
      data: res,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload media');
  }
};

