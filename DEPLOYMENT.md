# Deployment

## Live URLs

| Service | URL |
|---|---|
| Frontend (Vercel) | https://ajaia-llc-web-git-main-pulkits21s-projects.vercel.app |
| Backend API (Render) | https://ajaia-docs-api-x10y.onrender.com |
| API Health Check | https://ajaia-docs-api-x10y.onrender.com/health |

---

## Stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | Next.js 15, Tailwind CSS, Tiptap | Vercel |
| Backend | Node.js, Express v5 | Render (free tier) |
| ORM | Prisma v7 | — |
| Database | PostgreSQL | Neon (free tier) |

---

## Environment Variables

### Render (API)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `FRONTEND_URL` | `https://ajaia-llc-web.vercel.app` |
| `PORT` | Set automatically by Render |

### Vercel (Frontend)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://ajaia-docs-api-x10y.onrender.com` |

---

## Render Build & Start

| | Command |
|---|---|
| Build | `npm install && npm run build` |
| Start | `npm start` (runs `prisma migrate deploy && node dist/index.js`) |
| Root Directory | `apps/api` |

## Vercel Build

| | Value |
|---|---|
| Framework | Next.js |
| Root Directory | `apps/web` |
| Build Command | `next build` |
| Output Directory | `.next` |

---

## Notes

- Render free tier **spins down after 15 min of inactivity** — first request after idle takes ~30 s to wake up.
- Neon free tier has a 0.5 GB storage limit and also suspends on inactivity.
- File uploads (`/uploads`) are stored on Render's ephemeral filesystem — they are wiped on each redeploy. Use an object store (S3, Cloudflare R2) for persistent uploads.
