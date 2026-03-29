# Decisions

## 2025-03-29T15:32:00Z: Project Tech Stack
**By:** Kusumakar Althi
**What:** React + Vite + Tailwind CSS frontend, Node.js + Express backend, PostgreSQL with Prisma ORM, JWT + bcrypt auth, Haversine formula for distance/credits.
**Why:** User-approved tech stack for Community CarPool Tool MVP.

## 2025-03-29T15:32:00Z: Core Data Model
**By:** Kusumakar Althi
**What:** Users, Trips, JoinRequests, Credits. Driver schedules trips, riders browse/request, driver approves, credits calculated on distance.
**Why:** Core flow defined in requirements.

## 2025-03-29T15:32:00Z: No External APIs for MVP
**By:** Kusumakar Althi
**What:** Use Haversine formula for distance calculation — no Google Maps or external geocoding APIs.
**Why:** Keep MVP dependency-free and simple.
