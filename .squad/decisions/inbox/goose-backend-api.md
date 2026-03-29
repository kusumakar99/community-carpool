# Decision: Backend API Architecture

**Author:** Goose (Backend Developer)
**Date:** 2026-03-29
**Status:** Implemented

## Context
Built the complete backend for Community CarPool Tool.

## Decisions

### 1. Prisma 6.x over 7.x
Prisma 7.x removed `url` from the datasource block in `schema.prisma`, requiring migration to `prisma.config.ts` and adapters. Pinned to Prisma 6.x for classic schema support and simpler setup.

### 2. Credit Transfer Atomicity
Trip completion triggers credit transfers using `prisma.$transaction()`. All rider debits, driver credits, and Transaction records are created atomically — if any rider has insufficient balance, the entire completion rolls back.

### 3. Route Organization
- Auth routes: `/api/auth/*`
- Trip CRUD: `/api/trips/*`
- Join requests: `/api/trips/:id/join` (create) + `/api/join-requests/:id/accept|reject` (manage)
- Credits: `/api/credits/*`

Join request routes share a single router mounted at `/api` because they span both `/trips/` and `/join-requests/` URL namespaces.

### 4. Haversine-Based Credits
Credits per seat = `haversine_distance_km * 0.5`. The rate (0.5 credits/km) is defined as a constant in `src/utils/credits.js` for easy adjustment.

### 5. Server Port
Backend runs on port 3001 (configured via `PORT` env var), leaving 3000 free for the frontend.

## Impact
Frontend team (Maverick) should use these API routes. All endpoints except `/api/auth/register` and `/api/auth/login` require `Authorization: Bearer <token>` header.
