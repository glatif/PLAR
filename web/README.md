# PLAR Platform — web app

Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind CSS v4, styled with the PLAR design system (Geist + Lora, tangerine accent).

- Project docs: `../Resources/docs/index.md`
- Implementation plan and milestones: `../Resources/docs/16-implementation-plan.md`
- Design system (tokens live in `src/app/globals.css`): `../Resources/docs/design-system.html`

## Commands

```bash
npm install          # first time
npm run dev          # http://localhost:3000 (the desktop preview uses port 3100)
npm run lint
npm run typecheck    # regenerates route types, then tsc
npm run build
npm test             # unit and detection tests (Vitest)
npm run dev:phone    # HTTPS dev server for testing the camera on a phone (needs mkcert)
npm run assets:verification   # regenerate sample ID photos and faces in test-assets/
```

## Structure

| Path | What it is |
|---|---|
| `src/app/page.tsx` | Public homepage |
| `src/app/sign-in/` | Sign-in: email and password, one-click demo accounts (when `DEMO_LOGIN_PASSWORD` is set), TRU SSO placeholder |
| `src/app/workspace/` | Signed-in shell and role workspaces with live data from Supabase |
| `src/proxy.ts` | Refreshes the Supabase session and guards `/workspace` |
| `src/components/ui/` | Design-system primitives: Button, Badge, BrandMark, filled icons |
| `src/components/site/` | Homepage sections (header, footer, hero preview) |
| `src/components/app/` | Workspace components (role navigation) |
| `src/app/verify/`, `src/app/testing/` | Identity verification lab and its testing gallery (dev only) |
| `src/components/verification/`, `src/lib/verification/` | Camera flow, face tracking, ID detection and straightening, storage, AI check |
| `src/lib/` | Content, roles, `auth.ts` (signed-in viewer), `workspace-data.ts` (per-role queries), Supabase clients |

## Rules

- **Synthetic data only.** Never put real student information in code, seeds or tests.
- Use design tokens (`bg-surface`, `text-label-2`, `bg-accent`, `text-accent-text`, `font-serif`, `rounded-lg`, `shadow-2`, `.glass`, `.card`), not raw colours. Accent text and links use `text-accent-text`, never `text-brand`.
- Icons: Lucide outline by default; `src/components/ui/filled-icons.tsx` for selected navigation, toggles that are on, small status glyphs and white glyphs on coloured tiles. AI content uses `AiSparkle` and the `ai` badge tone.
- Glass is only for navigation and controls, never for content.
- This Next.js version differs from older ones: check `node_modules/next/dist/docs/` before using an unfamiliar API (see `AGENTS.md`). Read URL data (`params`, `searchParams`) inside `<Suspense>`.
