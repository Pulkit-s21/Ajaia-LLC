# AI Workflow Note

## Tools used

**Claude Code** (Anthropic's CLI agent) — used throughout the project for code generation, debugging, and documentation.

---

## Where AI materially sped up my work

**API layer.** All Express controllers, middleware, and routes were generated in one pass. Writing auth, CRUD, file upload, and sharing endpoints by hand would have taken the bulk of a day; with Claude it was under an hour, leaving more time for UX and testing.

**Tiptap integration.** The editor toolbar with all formatting extensions, the auto-save debounce, and the save indicator component were scaffolded immediately. The ProseMirror ecosystem is well-documented but tedious to wire up — generating the boilerplate and having it mostly correct on the first pass was a genuine time save.

**Mobile-responsive CSS.** Patterns like the bottom-sheet modal (`rounded-t-2xl sm:rounded-2xl`, `items-end sm:items-center`) and the touch-accessible delete button (`opacity-100 sm:opacity-0 sm:group-hover:opacity-100`) were generated correctly and didn't need iteration.

**Permission test suite.** The 9-case test file covering the full permission lifecycle (unshared → view-only → edit → owner-delete) was written in one generation and passed after a single Jest config fix.

---

## What I changed or rejected

**Prisma schema provider.** Initial generation used `provider = "prisma-client-js"` but Prisma 7 requires `provider = "prisma-client"` with a custom output path and `PrismaPg` driver adapter. Caught by reading the generated output and correcting the schema, `prisma.ts`, and import paths.

**Dark mode conflict in globals.css.** Generated CSS included a `@media (prefers-color-scheme: dark)` block that overrode hardcoded light Tailwind classes, making the UI invisible in dark mode. Removed after spotting the visual regression during manual testing.

**Color contrast.** Initial components used `text-gray-400` on white backgrounds (~2.85:1, fails WCAG AA). Reviewed every label and placeholder and bumped to `text-gray-600`+ across the board.

**uuid ESM import in tests.** Generated code imported the `uuid` package which ships as ESM and broke Jest. Replaced with `crypto.randomUUID()` (Node.js built-in) — no config changes needed, no extra dependency.

**Deployment scope.** AI suggested adding a live deployment step. I chose to skip it in favour of a clean local Docker path, which is more reliable to demonstrate and avoids managing secrets across free-tier hosting for a submission.

---

## How I verified correctness, UX quality, and implementation reliability

**TypeScript** — `tsc --noEmit` run after every significant change. Zero type errors in the final build.

**Automated tests** — 19 tests across two suites: auth flows, document CRUD, and all permission boundaries (unshared user denied, view-only blocked from edit/delete, edit-permission user blocked from delete, owner delete succeeds). Run with `npm test`.

**Manual browser testing** — walked the main user flows end to end: register, create doc, edit with rich formatting, autosave cycle, import a `.docx`, attach a file, share with a second account (incognito), verify view-only restrictions, upgrade to edit permission, verify write access. Checked mobile layout at 375px viewport.

**WCAG contrast** — checked foreground/background ratios manually against the 4.5:1 AA threshold for all normal text elements before and after the contrast pass.

---

## Honest assessment

AI was most valuable for eliminating boilerplate and initial scaffolding — the kind of work where correctness is verifiable by running the thing. It was least reliable on framework-specific details (Prisma 7 provider syntax, Tailwind v4 `@plugin` directive) where training data lagged the current API. Those cases required reading the actual library source or changelog to catch and correct.

The useful pattern throughout: generate, run, read the error, correct. Not: generate and ship.
