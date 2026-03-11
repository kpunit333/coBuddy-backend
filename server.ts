import express, { Application } from 'express';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';

dotenv.config();
connectDB();

const app: Application = express();

// Middleware for parsing JSON
app.use(express.json());

// Redirect /api/auth to our auth routes
app.use('/api/auth', authRoutes);

const PROTOCOL = process.env.SERVER_PROTOCOL;
const URL = process.env.SERVER_URL;
const PORT = process.env.SERVER_PORT;

app.listen(PORT, () => {
  console.log(`Nexus TS Server running on ${PROTOCOL}://${URL}:${PORT}/api`);
});