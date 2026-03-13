import mongoose from 'mongoose';

const connectDB = async (dbName: string): Promise<void> => {
  try {
    // MongoDB URI with coBuddy database - can be overridden in .env
    const mongoUri = process.env.MONGO_URI!;
    const connectionObj = {
      dbName: dbName
    };    
    
    const conn = await mongoose.connect(mongoUri, connectionObj);
    console.log(conn);
    
    console.log(`Nexus Database Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
};

export default connectDB;
