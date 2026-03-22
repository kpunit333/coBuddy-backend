# Previous Task: CORS/Body Parser [Complete]

## Previous Steps:
- [x] All steps complete.

# Task 2: Google OAuth with Arctic - Store tokens in Mongo OAuth table

## Steps:
- [x] 1. Plan and create TODO.md.
- [x] 2. Create src/models/OAuthTokens.ts model.
- [x] 3. Edit src/models/user.ts (add googleId, isGuest).
- [x] 4. Edit server.ts (added cookieParser for OAuth state; Arctic client in controller).
- [x] 5. Edit src/controllers/authController.ts (add googleInit, googleCallback, guestLogin).
- [x] 6. Edit src/routes/authRoutes.ts (add /google/init, /google/callback, /guest).
- [ ] 7. Add .env vars (GOOGLE_OAUTH_CLIENT_ID, GOOGLE_CLIENT_SECRET).
- [ ] 8. Test: npm run dev, visit /api/auth/google/login → callback → JWT.
