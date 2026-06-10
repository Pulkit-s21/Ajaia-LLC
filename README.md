# Ajaia Docs — Monorepo

Lightweight collaborative document editor. Monorepo with npm workspaces, Docker Compose for the full stack.

---

## Structure

```
ajaia-docs/
├── apps/
│   ├── api/          Express + Prisma + PostgreSQL
│   └── web/          Next.js 16 + Tailwind CSS + Tiptap
├── docker-compose.yml        Full stack (postgres + api + web)
├── docker-compose.dev.yml    Postgres only (for local dev)
├── .env.example              Root env template (Docker path)
└── package.json              npm workspaces root
```

---

## Tech Stack

| Layer    | Technology                            |
|----------|---------------------------------------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS|
| Editor   | Tiptap (ProseMirror)                  |
| Backend  | Node.js + Express                     |
| ORM      | Prisma 7                              |
| Database | PostgreSQL 16                         |
| Auth     | JWT + bcrypt                          |
| Infra    | Docker + Docker Compose               |

---

## Prerequisites

| Tool | Minimum version | Required for |
|---|---|---|
| Docker Desktop | Docker 24 | Both options |
| Node.js | 20 | Both options (to run `npm` scripts) |
| npm | 10 | Both options |

---

## Option A — Docker (recommended, zero config)

Runs Postgres, API, and web all in containers. Nothing needs to be installed beyond Docker.

### 1. Copy env
```bash
cp .env.example .env
```
Defaults work out of the box. You do not need to edit anything.

### 2. Start everything
```bash
npm run docker:up
```

This builds images and starts:
- **postgres** on port `5432`
- **api** on port `4000` (migrations run automatically on startup)
- **web** on port `3000`

> **First run:** image builds take 3–5 minutes. Wait until you see `Ready` in the web container logs before opening the browser.

> **Port conflict:** if PostgreSQL is already running locally it will be using port `5432`. Stop it first:
> - macOS (Homebrew): `brew services stop postgresql`
> - Linux: `sudo systemctl stop postgresql`

The command runs in the foreground — open a **new terminal tab**, then go to http://localhost:3000 and register an account.

### Stop
```bash
# Ctrl+C in the running terminal, then:
npm run docker:down   # removes containers and volumes
```

---

## Option B — Local dev (apps on host, Postgres in Docker)

Use this if you want hot-reload while editing code.

### 1. Install dependencies
```bash
npm install
```

### 2. Create the API env file
```bash
cp apps/api/.env.example apps/api/.env
```
The defaults connect to Postgres on `localhost:5432` with user `postgres` / password `postgres`. Edit if your local Postgres uses different credentials.

### 3. Start Postgres
```bash
npm run docker:dev
```

### 4. Run migrations
```bash
npm run db:migrate
```
This applies the existing migration to your local database. No input required.

### 5. Start dev servers
```bash
npm run dev
```

- API → http://localhost:4000
- Web → http://localhost:3000

Both servers have hot-reload. The API uses `nodemon` + `ts-node`; the web uses Next.js Turbopack.

---

## Workspace scripts

| Command | Description |
|---|---|
| `npm run dev` | Start api + web in parallel (with hot-reload) |
| `npm run dev:api` | API only |
| `npm run dev:web` | Web only |
| `npm run build` | Build both apps |
| `npm run test` | Run API tests |
| `npm run db:migrate` | Run Prisma migrations (interactive, dev only) |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run docker:dev` | Start Postgres in Docker (local dev) |
| `npm run docker:dev:down` | Stop dev Postgres |
| `npm run docker:up` | Full stack via Docker Compose |
| `npm run docker:down` | Stop and remove all containers + volumes |

---

## Running tests

```bash
npm run test
```

19 tests across two suites:
- `auth.test.ts` — register, login, token validation, document CRUD
- `permissions.test.ts` — view-only access, edit access, owner-only delete

Tests require a running Postgres instance (use `npm run docker:dev` first).

---

## Supported file types

| Operation | Formats |
|---|---|
| Import as new document | `.txt`, `.md`, `.docx` |
| Attach to existing document | `.txt`, `.md`, `.doc`, `.docx` |

`.docx` content is extracted using [mammoth](https://github.com/mwilliamson/mammoth.js) — headings, bold, italic, and lists are preserved; complex Word features (tables, tracked changes) are simplified.

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Sign in, receive JWT |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/documents` | ✓ | List owned + shared docs |
| POST | `/api/documents` | ✓ | Create document |
| POST | `/api/documents/import` | ✓ | Import `.txt`/`.md`/`.docx` as new doc |
| GET | `/api/documents/:id` | ✓ | Get document |
| PATCH | `/api/documents/:id` | ✓ | Update title / content |
| DELETE | `/api/documents/:id` | ✓ | Delete (owner only) |
| POST | `/api/documents/:id/upload` | ✓ | Attach file to document |
| GET | `/api/documents/:id/shares` | ✓ | List shares |
| POST | `/api/documents/:id/shares` | ✓ | Share with a user by email |
| DELETE | `/api/documents/:id/shares/:shareId` | ✓ | Revoke share |

---

## Features

- **Rich text editing** — bold, italic, underline, H1–H3, bullet/numbered lists, text alignment, horizontal rule
- **Auto-save** — debounced 1.5 s after last keystroke with a save indicator
- **File import** — upload `.txt`, `.md`, or `.docx` → becomes a new editable document (Word formatting preserved via mammoth)
- **Attachments** — attach files to any document; text/docx content is offered for inline import into the current document
- **Sharing** — share by email with view or edit permission; owner can revoke anytime
- **Dashboard** — separate "My Documents" and "Shared with me" sections
- **Permission enforcement** — read/write checks enforced at the API layer, not just the UI

---

## Architecture Notes

**What I prioritised:**
1. Editor-first — Tiptap with auto-save was the highest-risk piece so it went in first
2. Permission enforcement at the API layer — not just the UI
3. Simple JWT auth — no refresh tokens, keeps setup self-contained for this scope
4. File import as a first-class flow rather than a plain attachment store

**Trade-offs:**
- Real-time collaboration (WebSockets + CRDT) is the obvious next step; current model is last-write-wins
- `.docx` import uses `mammoth` to convert Word formatting to HTML; complex styles (tables, tracked changes) are simplified
- JWT is stored in localStorage — fine for this scope, swap for httpOnly cookies + short-lived tokens in production
- Uploaded files are on the local filesystem (`apps/api/uploads/`) — production would use signed S3 URLs
