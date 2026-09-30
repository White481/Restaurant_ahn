# Backend

Express 5 API written in TypeScript and backed by MySQL 8.

## Setup

1. Install Node.js 20 or later and MySQL 8.
2. From the repository root, initialize the database by running
   `database/schema.sql` in MySQL.
3. From `backend/`, copy `.env.example` to `.env` and set the database
   credentials.
4. Run `npm install`, then `npm run dev`.

The API listens on `http://localhost:3000` by default. Use `npm run build` to
compile TypeScript into `dist/`, and `npm start` to run the compiled server.

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Checks API and MySQL connectivity |
| `GET` | `/api/menu` | Lists menu items, optionally filtered by `?category=...` |

Menu responses use `{ "data": [...] }`. MySQL `DECIMAL` prices are returned as
decimal strings to preserve precision. Staff authentication, ordering, and
inventory routes are planned but not implemented yet.
