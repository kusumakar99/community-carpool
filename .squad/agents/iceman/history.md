# Iceman — History

## Learnings
- Project: Community CarPool Tool — carpooling platform with credit system
- User: Kusumakar Althi
- Stack: React 18 + Vite + Tailwind CSS
- Core flow: Registration → Login → Browse trips → Request to join → View status → Credits
- Pages needed: Register, Login, Dashboard, Trip List, Create Trip, Trip Detail, My Trips
- Used Vite @tailwindcss/vite plugin (not PostCSS) — single `@import "tailwindcss"` in index.css
- AuthContext uses axios instance with interceptor pattern; token stored in localStorage
- API responses handled with flexible field name mapping (camelCase & snake_case) for backend compatibility
- Haversine formula used client-side for distance/credit preview on trip creation
- All pages use Promise.allSettled for parallel API fetches with graceful degradation
- Vite proxy configured for /api → localhost:3001 to avoid CORS during dev
- Toast notifications implemented via simple state + setTimeout (no external library)
- TripCard component handles multiple backend response shapes (\_id/id, camelCase/snake_case fields)
