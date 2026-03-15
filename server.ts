import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import routes from './routeHandler.js';
import router from './routeHandler.js';
import routeHandler from './routeHandler.js';

dotenv.config();

const dbName = process.env.MONGO_DB_NAME!;
connectDB(dbName);

const app: Application = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Middleware for parsing JSON
app.use(express.json());

const PROTOCOL = process.env.SERVER_PROTOCOL;
const URL = process.env.SERVER_URL;
const PORT = process.env.SERVER_PORT;
const version = 'v1';

// Redirect v1/api to our routes
const apiBasePath = `${version}/api`;

app.use(`/${apiBasePath}`, routeHandler);

app.listen(PORT, () => {
  console.log(`Nexus TS Server running on ${PROTOCOL}://${URL}:${PORT}/${apiBasePath}`);
});