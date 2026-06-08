# Submission — Ajaia Docs

## What is included

| File / Folder | Description |
|---|---|
| `apps/api/` | Express + Prisma + PostgreSQL backend |
| `apps/web/` | Next.js 16 + Tiptap frontend |
| `README.md` | Local setup, run instructions, API reference, workspace scripts |
| `ARCHITECTURE.md` | Stack decisions, data model, request lifecycle, trade-offs |
| `AI_WORKFLOW.md` | AI tools used, where they helped, what was changed, how correctness was verified |
| `SUBMISSION.md` | This file |
| `VIDEO.txt` | Walkthrough video URL |
| `docker-compose.yml` | Full stack (postgres + api + web) |
| `docker-compose.dev.yml` | Postgres only, for local dev with host-run apps |
| `.env.example` | Environment variable template |

---

## Quickest way to run it

```bash
git clone <repo>
cd ajaia-docs
cp .env.example .env
npm run docker:up
```

Open http://localhost:3000 — register an account and start editing.

---

## What works end to end

- Register / login / logout
- Create, rename, edit, and delete documents
- Rich text: bold, italic, underline, H1–H3, bullet lists, numbered lists, horizontal rule, text alignment
- Auto-save (1.5 s debounce) with a save indicator
- Import `.txt`, `.md`, or `.docx` as a new editable document
- Attach files to an existing document; text/docx content offered for inline import
- Share a document by email with view or edit permission
- Revoke access
- Dashboard: separate "My Documents" and "Shared with me" sections
- In-document permission badge for non-owners (view-only hides the toolbar)

## What was intentionally deprioritised

- Live deployment (Docker Compose path is a single command — see README)
- Real-time collaboration (current model is last-write-wins; Yjs + WebSockets is the next step)
- Email invite flow (sharing requires the recipient to already have an account)
- Signed upload URLs (attachments served directly from `/uploads`)

---

## Running tests

```bash
npm test
```

19 tests across two suites: auth flows, document CRUD, and permission enforcement.
