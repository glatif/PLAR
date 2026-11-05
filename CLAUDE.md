# PLAR Platform Project

AI-assisted efficiency platform for Thompson Rivers University Open Learning's PLAR Competency-based Portfolio process.

## Where things are

- `Resources/project-email.md`: the stakeholder email that defines the two projects. Project #1 is assessment (top priority); Project #2 is advisor feedback (next priority).
- `Resources/General/`: the original stakeholder documents. They are confidential and include student material.
- `Resources/docs/index.md`: **start here.** The project documentation, with source citations.
- `Resources/docs/project-context.md`: working notes, decisions, status and next steps. Keep this up to date instead of using account-level memory.
- `Resources/docs/stakeholder-questions.md`: open questions for the stakeholders.

## The app

- Code lives in `web/` (Next.js 16 App Router with Cache Components, TypeScript, Tailwind v4). See `web/README.md`.
- Commands (run in `web/`): `npm run dev`, `npm run lint`, `npm run typecheck`, `npm run build`. The desktop preview config is `.claude/launch.json` (port 3100).
- This Next.js version has breaking changes: read `web/node_modules/next/dist/docs/` before using an unfamiliar API, and read `params` inside `<Suspense>`.
- Milestones and the architecture decision log: `Resources/docs/16-implementation-plan.md`.
- Database: `supabase/` (Supabase CLI project: migrations, seed, pgTAP tests). Hosted dev project `plar-dev`, ref `dxnurogvpdxtbaocallr`, Canada (Central). Every table has row-level security on, and each new table gets a pgTAP test per role.
- `harness/` configures and tests Supabase: `npm run doctor`, `npm run check` (hosted dev) / `check:local`, `npm run types`, `dev:push`. See `harness/README.md`.
- The web app uses the publishable key only. Secret or service keys never go in `web/` or in git.
- Synthetic data only in code, seeds and tests.

## Working rules

- Cite a source ID (see `Resources/docs/00-sources.md`) for every fact added to the docs. Keep facts, assumptions and proposals separate.
- Do not record the per-step effort estimates from the sources, or the readiness-questionnaire credential.
- Treat AI scoring and AI-conducted interviews as **unconfirmed** until the stakeholders answer Q-SCOPE-2 and Q-INT-1.
- Do not send real student content to external services without approval.
- Store project notes and memory in this folder, not in account-level memory.
- Don't name or commit to an LLM provider. Any AI service must guarantee our data is not used to train its models (`Resources/docs/15-technical-approach.md` §3.3).
- Interviews: the built-in interview room is preferred; Zoom is the fallback. ID verification is AI-assisted, with a person deciding.
- Apply the design system to all UI and all generated documents (PDFs, reports, proposals). The source of truth is `Resources/docs/design-system.html` (Geist + Lora, tangerine accent, outline + filled icons); `14-design-system.md` is the older teal write-up and still needs updating.
- **Shareable documents** (the features doc, the design system, every PDF, proposal or email for the supervisor or stakeholders) must **not** contain question IDs (Q-…), source IDs (P1-…, P2-…), or references and links to the local `.md` files. Those are for our local reference only. Refer to department materials by their real titles instead.
