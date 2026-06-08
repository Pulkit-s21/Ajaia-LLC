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
├── .env.example
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

## Running with Docker (recommended)

### 1. Copy and configure env
```bash
cp .env.example .env
# Edit .env if needed (defaults work out of the box)
```

### 2. Start everything
```bash
npm run docker:up
```

This builds and starts:
- **postgres** on port `5432`
- **api** on port `4000` (runs migrations automatically on startup)
- **web** on port `3000`

Open http://localhost:3000 and register an account.

### Stop
```bash
npm run docker:down   # stops containers and removes volumes
```

---

## Running locally (apps on host, postgres in Docker)

### 1. Start Postgres via Docker
```bash
npm run docker:dev
```

### 2. Configure API env
```bash
# apps/api/.env is already set up for localhost:5432
# Edit DATABASE_URL if your credentials differ
```

### 3. Install dependencies
```bash
npm install   # installs all workspaces from root
```

### 4. Run migrations
```bash
npm run db:migrate
```

### 5. Start dev servers
```bash
npm run dev
```

- API → http://localhost:4000
- Web → http://localhost:3000

---

## Workspace scripts

| Command | Description |
|---|---|
| `npm run dev` | Start api + web in parallel |
| `npm run dev:api` | API only |
| `npm run dev:web` | Web only |
| `npm run build` | Build both apps |
| `npm run test` | Run API tests |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run docker:dev` | Start Postgres in Docker |
| `npm run docker:dev:down` | Stop dev Postgres |
| `npm run docker:up` | Full stack via Docker Compose |
| `npm run docker:down` | Stop and remove all containers + volumes |

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
| POST | `/api/documents/:id/upload` | ✓ | Attach file |
| GET | `/api/documents/:id/shares` | ✓ | List shares |
| POST | `/api/documents/:id/shares` | ✓ | Share with a user |
| DELETE | `/api/documents/:id/shares/:shareId` | ✓ | Revoke share |

---

## Features

- **Rich text editing** — bold, italic, underline, H1–H3, bullet/numbered lists, alignment, horizontal rule
- **Auto-save** — debounced 1.5 s after last keystroke with save indicator
- **File import** — upload `.txt`, `.md`, or `.docx` → becomes a new editable document (Word formatting preserved via mammoth)
- **Attachments** — attach `.txt`, `.md`, `.doc`, `.docx` to any document; text/docx content is offered for import into the current document
- **Sharing** — share by email with view or edit permission; owner can revoke anytime
- **Dashboard** — separate sections for owned vs. shared documents

---

## Architecture Notes

**What I prioritised:**
1. Editor-first — Tiptap with auto-save was the highest-risk piece so it went in early
2. Permission enforcement at the API layer — not just the UI
3. Simple JWT auth — no refresh tokens, keeps setup self-contained for this scope
4. File import as a first-class flow rather than a plain attachment store

**Trade-offs:**
- Real-time collaboration (WebSockets + CRDT) is the obvious next step; current model is last-write-wins
- `.docx` import uses `mammoth` to convert Word formatting to HTML; complex styles (tables, tracked changes) are simplified
- JWT in localStorage is not production-hardened — swap for httpOnly cookies + short-lived tokens in production
