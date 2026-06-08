# Architecture Note — Ajaia Docs

## What this is

A lightweight collaborative document editor. Two users can work on the same document with distinct permissions (view or edit). Documents persist across sessions. File content can be imported from `.txt`, `.md`, or `.docx`.

---

## Stack decisions

### Monorepo with npm workspaces

`apps/api` (Express) and `apps/web` (Next.js) share one `node_modules` and one `package.json` at the root. This keeps the dev loop fast — one `npm run dev` starts both, one `npm install` resolves all dependencies, one `npm test` runs the suite.

### Express + Prisma + PostgreSQL

Express was chosen over a heavier framework (NestJS, Fastify) to keep the surface area small — this is a four-route API, not a platform. Prisma 7 with the `prisma-client` provider and `PrismaPg` adapter gives type-safe queries without ceremony. PostgreSQL was chosen over SQLite because it supports the concurrent access pattern the sharing model implies, and because the Docker Compose setup makes it trivial to spin up locally.

### Tiptap (ProseMirror)

Tiptap was chosen over Quill or Slate because it has first-class TypeScript support, a clean extension model, and ships StarterKit covering bold/italic/headings/lists in one import. The editor state is stored as HTML in the `content` column — readable, portable, and renderable without Tiptap on the read path. Auto-save is a 1.5-second debounce on every keystroke; a `SaveState` enum drives the save indicator in the header.

### JWT auth

Stateless JWT signed with `jose`. No refresh tokens — the access token lasts 7 days. This is fine for this scope; in production I'd use short-lived access tokens + httpOnly cookie refresh tokens.

### File import via mammoth

`.docx` files are parsed server-side with `mammoth.convertToHtml`. This preserves headings, bold, italic, bullet lists, and numbered lists. Complex Word features (tracked changes, tables, footnotes) are simplified or dropped — acceptable for a doc editor MVP.

---

## What I prioritised

1. **Editor correctness first.** Tiptap + auto-save was the highest-risk piece and went in first. Everything else is only useful if editing actually works.
2. **Permission enforcement at the API layer.** The UI respects permissions, but every mutating endpoint also checks ownership or share level in the database. A determined user cannot bypass the frontend to edit or delete a document they don't own.
3. **Clean local dev path.** One `docker compose up` command starts postgres, runs migrations, and serves both the API and web app. Reviewers should not need to configure anything beyond copying `.env.example`.

## What I deprioritised

- **Real-time collaboration** — the current model is last-write-wins. WebSockets + a CRDT library (Yjs) is the natural next step.
- **Live deployment** — the Docker Compose path is reproducible and one command. A production deployment would add a CDN, a managed DB, and httpOnly cookie auth.
- **Email notifications** — sharing currently requires the recipient to already have an account. A real product would send an invite email.
- **Attachment download security** — uploaded files are served from a static `/uploads` directory. Production would use signed S3 URLs.

---

## Data model

```
User
  id, email, name, passwordHash, createdAt

Document
  id, title, content (HTML), ownerId → User, createdAt, updatedAt

DocumentShare
  id, documentId → Document, userId → User, permission (view | edit)
  unique(documentId, userId)

Attachment
  id, documentId → Document, filename, originalName, mimeType, size, createdAt
```

---

## Request lifecycle (example: update document)

```
PATCH /api/documents/:id
  → authenticate middleware (JWT verify → req.userId)
  → updateDocument controller
      → find document by id
      → check ownerId === userId OR DocumentShare.permission === "edit"
      → 403 if neither
      → prisma.document.update(title, content)
      → 200 { document }
```
