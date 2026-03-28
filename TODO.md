# Task: Make login and signup transactional

## Plan:
- Wrap signup User.create in session.withTransaction.
- Login read-only (findOne/compare), no tx needed but wrap token gen if multi-write.

## Steps:
- [x] 1. Update auth.service.ts with transactions for signup/login.

