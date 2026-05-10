# Team Task Manager

Production-style monorepo for managing projects, members, and tasks with **JWT authentication**, **global role-based access control** (Admin vs Member), and a **React + Tailwind** dashboard backed by **Express + MongoDB (Mongoose)**.

## Features

- Signup / login with bcrypt password hashing and JWT sessions.
- **Admin** can create/manage projects, manage membership, and fully manage tasks.
- **Members** see projects they belong to, comment on tasks, and may **only change the status of tasks assigned to them** (via `PATCH /api/tasks/:id/status`).
- Dashboard aggregates counts, per-project progress (completed ÷ total tasks), and recent activity.
- REST API with validation, centralized errors, and HTTP status codes aligned to semantics.

## Repository layout

| Path        | Description                              |
| ----------- | ---------------------------------------- |
| `backend/`  | Express API, Mongoose models, middleware |
| `frontend/` | Vite + React + Tailwind SPA              |
| `api-examples.http` | Copy/paste REST smoke tests      |

## Prerequisites

- Node.js **18+**
- MongoDB **6+** running locally or reachable via connection string

Quick Mongo (Docker):

```bash
docker run -d --name ttm-mongo -p 27017:27017 mongo:7
```

## Backend setup

```bash
cp .env.example .env   # Windows: copy .env.example .env
npm install
npm run seed           # required once: creates admin user + demo data (wipes collections)
npm run dev
```

**First login:** Until you run `npm run seed` against the same MongoDB instance as `MONGODB_URI`, `admin@company.com` does not exist and login returns “Invalid email or password”. After seeding, use the credentials in the table below.

Default API: `http://localhost:5000`

### Seed credentials

| Role   | Email              | Password   |
| ------ | ------------------ | ---------- |
| Admin  | `admin@company.com` | `Admin123!` |
| Member | `member@company.com` | `Member123!` |
| Member | `alex@company.com`   | `Member123!` |

## Frontend setup

```bash
npm install
npm run dev
```

SPA dev server (with API proxy → `http://localhost:5000`): `http://localhost:5173`

Optional absolute API base (production):

```bash
echo VITE_API_URL=https://your.api.host/api > .env.local
```

## REST surface (quick reference)

| Method & path | Notes |
| --- | --- |
| `POST /api/auth/signup` | Registers **member** role users |
| `POST /api/auth/login` | Returns JWT |
| `POST /api/auth/logout` | Stateless — mainly for client symmetry |
| `GET /api/users/me` | Profile |
| `PUT /api/users/me` | Update profile |
| `PATCH /api/users/me/password` | Rotate password |
| `GET /api/users` | **Admin** listing (for invitations) |
| `GET /api/projects` | Projects visible to user |
| `POST /api/projects` | **Admin** |
| `PUT /DELETE /api/projects/:id` | **Admin** |
| `POST/DELETE …/projects/:id/members[...]` | **Admin** Adds/removes members |
| `GET /api/tasks` | Filters: `status`, `priority`, `assignedTo`, `projectId`, date window, `overdue=true` |
| `POST /api/tasks` | **Admin** |
| `PUT /DELETE /api/tasks/:id` | **Admin** |
| `PATCH /api/tasks/:id/status` | **Assignee-only** lifecycle updates |
| `GET/POST /api/tasks/:id/comments` | Project members |

Full runnable samples live in [`api-examples.http`](./api-examples.http).

### Extra route (beyond original brief)

Members need a focused status pathway without full admin edit rights → `PATCH /api/tasks/:id/status`.

## Data model recap

- **User**: name, email, hashed password, `role ∈ {admin, member}`, timestamps.
- **Project**: title, description, enum status, start/end dates, `createdBy`, `members[]`.
- **Task**: title/description, linkage to project & users, enums for priority/status, due date.
- **Comment**: `taskId`, `userId`, message body.
- **Activity**: lightweight audit feed powering the dashboard widgets.

## Security notes for production hardening

- Rotate `JWT_SECRET` to a high-entropy value and store safely.
- Terminate TLS at your edge/load balancer.
- Enable rate limiting and refresh-token flows if exposing publicly.
- Tighten CORS origins beyond the dev default (`CLIENT_URL`).
- Prefer Argon2 or tuned bcrypt cost if throughput allows.

## Development scripts

Backend:

- `npm run dev` — `node --watch` auto-reloads.
- `npm run seed` — wipes & re-inserts deterministic fixtures.

Frontend:

- `npm run dev` — Vite HMR.
- `npm run build` — static production bundle (`dist/`).

## Troubleshooting

- **`MONGODB_URI is not defined`** — copy `.env.example` to `.env` and ensure it sits beside `backend/package.json`.
- **`JWT_SECRET is required`** — same as above for backend env.
- **CORS failures** — align `CLIENT_URL` with SPA origin (`http://localhost:5173` locally).

## License

MIT — freely extend for internal tools or coursework demos.
