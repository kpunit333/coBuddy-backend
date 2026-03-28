import { Google } from "arctic";
import { env } from "../config/env.ts";

export const google = new Google(
  env.GOOGLE_OAUTH_CLIENT_ID!,
  env.GOOGLE_OAUTH_CLIENT_SECRET!,
  "http://localhost:8000/api/v1/auth/google/callback" // We will create this route to verify after login
);