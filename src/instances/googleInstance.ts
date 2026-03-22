import { Google } from "arctic";
import dotenv from "dotenv";
import { env } from "../config/env.ts";

// dotenv.config();

// const env = process.env;

console.log("env ", env.GOOGLE_OAUTH_CLIENT_ID, env.GOOGLE_OAUTH_CLIENT_SECRET);


export const google = new Google(
  env.GOOGLE_OAUTH_CLIENT_ID!,
  env.GOOGLE_OAUTH_CLIENT_SECRET!,
  "http://localhost:8000/api/v1/auth/google/callback" // We will create this route to verify after login
);