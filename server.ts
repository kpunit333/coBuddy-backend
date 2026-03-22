import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application } from 'express';
import mainController from './mainController.js';
import connectDB from './src/config/db.js';
import { env } from './src/config/env.js';

const dbName = env.MONGO_DB_NAME!;
connectDB(dbName);

const app: Application = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Middleware for parsing JSON
app.use(express.json());
app.use(cookieParser());

const PROTOCOL = env.SERVER_PROTOCOL;
const URL = env.SERVER_URL;
const PORT = env.SERVER_PORT;
const VERSION = env.SERVER_VERSION;
// Redirect v1/api to our routes
const apiBasePath = `api/${VERSION}`;

app.use(`/${apiBasePath}`, mainController);

app.listen(PORT, () => {
  console.log(`Nexus TS Server running on ${PROTOCOL}://${URL}:${PORT}/${apiBasePath}`);
});
