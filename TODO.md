# Image Upload to MongoDB with CDN URL - Implementation Tracker

## Plan Overview
Enhance media upload to return CDN URL (local: http://localhost:PORT/api/v1/media/:id), console.log it, integrate to user.profileImg, add serving endpoint.

## Completed Steps
- [x] 1. Read mainController.ts for routing structure
- [x] 2. Update src/services/media.service.ts: Add CDN URL logic to uploadMedia, console.log, return URL
- [x] 3. Update src/services/auth.service.ts: In signup, save mediaId to user.profileImg
- [x] 4. Create src/controller/media.controller.ts: GET /media/:id to stream image from DB
- [x] 5. Update mainController.ts: Mount media controller routes under /api/v1/media

**Step 6 completed: Task implemented and ready for testing.**

Run `npm run dev` to restart server, then test signup with image file to see console.log(CDN URL) and fetch URL to verify image serves.

## Follow-up
- Restart server: `npm run dev`
- Test endpoint: curl or Postman
