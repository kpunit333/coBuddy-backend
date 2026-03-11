import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    // Ensure MONGO_URI is defined in your .env
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`Nexus Database Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
};

export default connectDB;