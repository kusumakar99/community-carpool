# Routing Rules

## Signal → Agent Mapping

| Signal | Agent(s) | Notes |
|--------|----------|-------|
| Architecture, design decisions | Maverick | Sync for approval gates |
| Backend API, Express, Prisma, database | Goose | Background default |
| Frontend React, UI, Tailwind, components | Iceman | Background default |
| Tests, quality, edge cases, validation | Viper | Background default |
| Code review, PR review | Maverick | Sync — gates work |
| "Team" or multi-domain | Goose + Iceman + Viper | Parallel fan-out |
| Logging, decisions, memory | Scribe | Background always |
| Work queue, backlog, monitoring | Ralph | See Ralph protocol |

## Domain Keywords

| Keyword Pattern | Routes To |
|----------------|-----------|
| prisma, schema, migration, model, database, postgres | Goose |
| route, endpoint, API, middleware, auth, JWT, bcrypt | Goose |
| credit, haversine, distance, calculation | Goose |
| react, component, page, UI, tailwind, CSS, form | Iceman |
| vite, build, bundle, frontend config | Iceman |
| test, spec, edge case, validation, coverage | Viper |
| structure, architecture, pattern, decision | Maverick |
