# Goose — History

## Learnings
- Project: Community CarPool Tool — carpooling platform with credit system
- User: Kusumakar Althi
- Stack: Node.js + Express, PostgreSQL, Prisma 6.x, JWT + bcrypt
- Core flow: Driver schedules trip → Users browse → Request join → Driver approves → Credits calculated by Haversine distance
- Credit system: Credits represent fuel + driving charges, calculated based on trip distance
- Prisma 7.x removed `url` from datasource block in schema; pinned to Prisma 6.x for classic schema support
- Used `@@unique([tripId, riderId])` on JoinRequest to prevent duplicate join requests per trip
- Credit transfers on trip completion use Prisma `$transaction` for atomicity — rider balances are checked and decremented, driver is credited, and Transaction records created in one atomic block
- Express 5.x was installed (latest); all route handlers use async/await with try/catch for error handling
- Join request routes mounted at `/api` prefix (not `/api/join-requests`) since the routes file defines both `/trips/:id/join` and `/join-requests/:id/accept|reject` paths
- All users start with 100 credits (Prisma default on User model)
- Credits per seat = haversine_distance_km * 0.5, rounded to 2 decimal places
