AI-Native Workflow Note (draft — paste into README or submit separately)

Which AI tools I used

I used Claude Code throughout the project — for code generation (boilerplate), debugging, and documentation.

Where AI materially sped up my work

API layer — all Express controllers, middleware, and routes were generated in one pass. Writing auth, CRUD, file upload, and sharing endpoints by hand would have taken the bulk of a day; with Claude it took under an hour.
Tiptap integration — the editor toolbar with all formatting extensions, auto-save debounce, and the save indicator component were scaffolded instantly. The ProseMirror ecosystem is well-documented but tedious to wire up.
Mobile-responsive CSS — patterns like the bottom-sheet modal (rounded-t-2xl sm:rounded-2xl, items-end sm:items-center) and the touch-accessible delete button (opacity-100 sm:opacity-0 sm:group-hover:opacity-100) were generated correctly on the first pass.
Test suite — the 9-case permission enforcement test file (permissions.test.ts) covering the full view → edit → owner-delete lifecycle was written in one generation and passed immediately after the Jest ESM issue was fixed.
What AI-generated output I changed or rejected

Prisma schema — initial generation used prisma-client-js as the provider; Prisma 7 requires prisma-client. Caught by reading the generated output and correcting the schema and import path.
globals.css dark mode conflict — generated CSS included a @media (prefers-color-scheme: dark) block that overrode hardcoded light Tailwind classes, making the UI invisible in dark mode. Removed after spotting the visual regression.
Color contrast — initial components used text-gray-400 on white backgrounds (~2.85:1, fails WCAG AA). Reviewed and bumped to text-gray-600+ across all labels and placeholder text.
uuid ESM in tests — generated code imported uuid which ships as ESM and broke Jest. Replaced with crypto.randomUUID() (Node.js built-in) to avoid the transform configuration issue.
Deployment scope — AI suggested adding live deployment; I chose to skip it in favour of a clean local Docker path, which is more reliable to demonstrate under interview conditions.
How I verified correctness, UX quality, and implementation reliability

TypeScript — tsc --noEmit run after every significant change; zero type errors in the final state.
Test suite — 19 automated tests cover auth, document CRUD, and all permission boundaries (unshared user denied, view-only blocked from edit/delete, edit-permission user blocked from delete, owner delete succeeds).
Manual browser testing — walked through the main user flows (register, create doc, edit with formatting, import .docx, share with second account, verify view-only restrictions) in a real browser.
WCAG contrast — checked foreground/background ratios manually against the 4.5:1 AA threshold for normal text.