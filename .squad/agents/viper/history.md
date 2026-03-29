# Viper — History

## Learnings
- Project: Community CarPool Tool — carpooling platform with credit system
- User: Kusumakar Althi
- Key test areas: Auth (JWT, bcrypt), credit calculation (Haversine), trip CRUD, join request lifecycle
- Credit edge cases: zero distance, same origin/destination, very long distances
- Created server/utils/{haversine,credits,auth}.js and server/tests/*.test.js (48 tests, 3 suites)
- Haversine: toBeCloseTo with negative precision works well for geospatial tolerance (±50 km for intercity)
- Credits: guard against NaN/null/negative/string inputs — return 0 for any non-positive-number
- Auth: bcrypt salts ensure identical passwords produce unique hashes; use jwt.decode() (not verify) for inspecting payload in tests
- Pattern: create utility modules first, then tests, to keep the feedback loop fast
