# Frontend Architecture Decision — Iceman

**Date:** 2025-07-18
**Author:** Iceman (Frontend Developer)

## Decisions

### 1. Tailwind CSS via Vite Plugin
Used `@tailwindcss/vite` plugin instead of PostCSS config. Simpler setup — only `@import "tailwindcss"` in index.css.

### 2. Flexible API Response Mapping
All components handle both camelCase (`originName`) and snake_case (`origin_name`) field names, plus `_id`/`id` variants. Backend team can use either convention.

### 3. Vite Proxy for API
Vite dev server proxies `/api` → `http://localhost:3001`. Backend should serve all endpoints under `/api`.

### 4. Auth Pattern
JWT stored in localStorage. AuthContext provides an `api` axios instance with Authorization header auto-injected. Token validated on app load via `GET /api/auth/me`.

### 5. Credit Preview
Trip creation form calculates Haversine distance client-side and shows `distance * 0.5` credits preview. Backend should do the authoritative calculation.

### 6. No External UI Libraries
Used only Tailwind utility classes — no component libraries. Toast notifications are state-based with setTimeout.
