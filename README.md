# Chirpy

A small Express + PostgreSQL (Drizzle ORM) API server: users can sign up, log in, and post short "chirps".

## Stack

- Express 5
- Drizzle ORM (`postgres` driver) with SQL migrations under [src/db](src/db)
- JWT access tokens + opaque refresh tokens (`jsonwebtoken`, `argon2` for password hashing)
- Vitest for tests

## Setup

1. Install dependencies: `npm install`
2. Create a `.env` file with:
   - `DB_URL` — Postgres connection string
   - `SECRET` — JWT signing secret
   - `POLKA_KEY` — API key expected from the Polka webhook
3. Run migrations automatically on startup (handled by [src/db/db.ts](src/db/db.ts)), or manually via `npm run migrate`.

## Scripts

- `npm run dev` — build and start the server (port `8080`)
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled server
- `npm test` — run Vitest tests
- `npm run generate` — generate a new Drizzle migration from `src/db/schema.ts`
- `npm run migrate` — apply pending migrations

## API routes

Routes in [src/index.ts](src/index.ts) are grouped by topic:

### Admin

| Method | Path | Description |
|---|---|---|
| GET | `/admin/metrics` | HTML page showing the `/app` static site hit count |
| POST | `/admin/reset` | Dev-only: deletes all users (cascades to chirps/tokens) |

### Health check

| Method | Path | Description |
|---|---|---|
| GET | `/api/healthz` | Returns `OK` |

### Users

| Method | Path | Description |
|---|---|---|
| POST | `/api/users` | Create a new user (`email`, `password`) |
| PUT | `/api/users` | Update the logged-in user's email/password (requires bearer JWT) |

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/login` | Verify credentials, return an access JWT + refresh token |
| POST | `/api/refresh` | Exchange a valid refresh token for a new access JWT |
| POST | `/api/revoke` | Revoke a refresh token |

### Chirps

| Method | Path | Description |
|---|---|---|
| GET | `/api/chirps` | List chirps; optional `?authorId=` filter and `?sort=asc\|desc` (default `asc`) |
| GET | `/api/chirps/:chirpID` | Fetch a single chirp |
| POST | `/api/chirps` | Create a chirp for the logged-in user (140 char max, profanity filtered) |
| DELETE | `/api/chirps/:chirpID` | Delete a chirp, only allowed for its author |

### Webhooks

| Method | Path | Description |
|---|---|---|
| POST | `/api/polka/webhooks` | Upgrades a user to Chirpy Red on `user.upgraded` event (requires `ApiKey` header matching `POLKA_KEY`) |

## Project layout

- [src/index.ts](src/index.ts) — route definitions
- [src/auth.ts](src/auth.ts) — password hashing, JWT, refresh token, header-parsing helpers
- [src/middles.ts](src/middles.ts) — logging, body parsing, error handling, chirp validation middleware
- [src/errors.ts](src/errors.ts) — custom error classes mapped to HTTP statuses
- [src/config.ts](src/config.ts) — env-derived app config
- [src/db/schema.ts](src/db/schema.ts) — Drizzle table definitions (`users`, `chirps`, `refresh_tokens`)
- [src/db/queries/](src/db/queries/) — query helpers per table
