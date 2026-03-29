# Decision: Backend Test Foundation

**Author:** Viper (Tester)  
**Date:** 2025-07-14  
**Status:** Accepted

## Context
The `server/` directory did not exist. To unblock testing, the utility modules had to be created alongside the tests.

## Decisions

1. **Created utility modules** (`haversine.js`, `credits.js`, `auth.js`) in `server/utils/` following the spec: Haversine (lat1, lng1, lat2, lng2) → km; Credits (km) → km × 0.5; Auth (JWT + bcrypt helpers).
2. **`calculateCredits` guards invalid inputs** — returns 0 for negative, NaN, null, undefined, or string values rather than throwing.
3. **Rounding strategy** — credits are rounded to 2 decimal places (`Math.round(x * 100) / 100`).
4. **bcryptjs over bcrypt** — chose `bcryptjs` (pure JS) to avoid native build issues across environments.
5. **Test tolerances** — Haversine tests use `toBeCloseTo` with negative precision for city-to-city comparisons (±50 km), matching real-world GPS variance.

## Implications
- Goose/Iceman can import these utils directly when building routes.
- If the credit formula changes, update both `credits.js` and `credits.test.js`.
