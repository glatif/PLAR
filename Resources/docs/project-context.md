# Project Context (Working Notes)

Team-internal notes that keep the project's working context in this folder. They replace any notes held in a personal or account-level memory.

[← Back to index](index.md)

## Snapshot

- **Client:** the TRU Open Learning PLAR department (Director: Susan Forseille) [P2-H p.1].
- **Ask:** "PLAR efficiencies using AI/technology". Project #1 is the assessment of Competency-based Portfolios (top priority). Project #2 is advisor feedback (next priority) [EMAIL].
- **Their next expectation:** an approximate timeline for our proposal [EMAIL].
- **Our intended direction (project lead):** a Next.js web app with role tiers; a built-in interview room (Zoom as a fallback) with photo-ID verification; AI integrations under a no-training guarantee (provider not chosen); automated reminders; AI-suggested standard comments; a single design system; role-specific user documentation and a video walkthrough. See [01 §4](01-project-overview.md#4-project-team-direction-from-our-project-lead-not-from-the-sources).

## Decisions and conventions so far

| Date | Decision | By |
|---|---|---|
| 2026-10-22 | Documentation lives in `Resources/docs/`. Every fact cites its source ID ([00-sources.md](00-sources.md)). | Project lead |
| 2026-10-22 | **Leave out** of all project docs and discussions: the per-step effort estimates in the sources, and the readiness-questionnaire credential. Process deadlines that drive features (the 24-week window, the reminder schedule, extension lengths, report-due and retention rules) are kept. | Project lead (interpreted by Claude; confirm) |
| 2026-10-22 | Project memory and notes stay in the project folder (this file and the root `CLAUDE.md`), not in account-level memory. | Project lead |
| 2026-10-22 | Advisor reminders will be automated. The details are to be confirmed with stakeholders (Q-AUTO-1). | Project lead |
| 2026-10-22 | **Interviews:** propose our **own built-in interview room** to conduct and stream interviews. **Zoom is the fallback.** | Project lead |
| 2026-10-22 | **LLM:** don't commit to a provider. Present two options, the **Microsoft Copilot ecosystem** and a **proprietary multimodal model through a protected endpoint**. **Any integration must guarantee our data is not used to train the provider's models.** | Project lead |
| 2026-10-22 | **Design system:** an Apple-inspired, teal-accent system for the platform **and all documents** (PDFs, reports, proposals). See [14-design-system.md](14-design-system.md). | Project lead |
| 2026-10-22 | **Features doc:** plain language, organised by category, **not by phase**. See [13-features.md](13-features.md). | Project lead |
| 2026-10-22 | **Identity verification:** the student shows photo ID to the camera before the interview; a multimodal model assists; a person confirms; images are deleted promptly. | Project lead |
| 2026-10-22 | **Shareable docs stay clean:** no question IDs, source IDs or local `.md` references in anything sent to the supervisor or stakeholders (13-features, 14-design-system, PDFs, emails). Traceability lives in the local docs (00–12, stakeholder-questions). | Project lead |
| 2026-10-29 | **Feature list approved**; implementation starts. Plan in [16-implementation-plan.md](16-implementation-plan.md). The app lives in `web/` (Next.js 16, Tailwind v4). | Project lead |
| 2026-10-29 | **Light theme only** for the platform. Dark tokens are kept behind a `.dark` class (not used), and `dark:` utilities follow that class, not the OS setting. | Project lead |
| 2026-10-30 | **New design system adopted:** Geist (interface) + Lora (headlines and reading), **tangerine** accent instead of teal, warm neutrals, still Apple-based and light only. Outline icons by default plus a **filled icon set** for selected navigation, toggles that are on, small status glyphs and white glyphs on coloured tiles. Interactive spec: [design-system.html](design-system.html) (now the source of truth for UI). Accent fill `#C2550A` (white text 4.57:1), accent text `#A8470B`, brand `#F5761A`; AI marked in indigo. `web/` updated to match. **Still to update:** `14-design-system.md` and the PDF covers/print CSS (still teal). | Project lead |
| 2026-10-31 | **Backend: Supabase** in the Canada (Central) region (database with row-level security, sign-in, storage, queues, realtime). The app runs on our own server with a proper domain. **Delivery window: 1 Nov 2026 → 28 Feb 2027** (17 weeks), planned week by week in [timeline.html](timeline.html). ADRs 010–012 in [16-implementation-plan.md](16-implementation-plan.md). | Project lead |
| 2026-11-05 | **Supabase free plan for week 1**: one hosted dev project in Canada (Central) under the project lead's organisation. Synthetic data only; no demo accounts on hosted projects. Staging and production follow when a paid plan is in place. | Project lead |
| 2026-11-05 | **One cloud database for everything:** the hosted dev project `plar-dev`. No staging project and no local stack for now. **Demo accounts** (one per role, simple shared password, listed in `harness/DEMO-ACCOUNTS.md`) and synthetic cases live in dev; they are removed before any real data. Email-and-password sign-in plus one-click demo sign-in are built; TRU single sign-on follows. | Project lead |
| 2026-11-11 | **Identity verification lab** built (`/verify`, `/testing`): face photo, head-movement video, ID front/back with live detection, background straightening, success/failure states, reviewer decisions. Captures stay on the developer's computer. See [17-identity-verification.md](17-identity-verification.md). | Project lead |
| 2026-11-11 | **Lab AI check approved:** face match (percentage) and ID reading via OpenRouter, model `google/gemini-3.5-flash-lite`, with `data_collection: "deny"`. An exception to the "no provider" and "no external services" rules **for the lab only**; reassess against the AI requirements before real student data. The key lives only in `web/.env.local`; rotate it (it was shared in chat). | Project lead |
| 2026-11-12 | **Hosting server:** PLAR deployed to the shared Ubuntu server `74.208.142.195` the same way as the living-heritage app there (`/opt/projects/plar`, Docker, `127.0.0.1:9000`, Live at **https://plar.74-208-142-195.sslip.io** (free sslip.io hostname + Let's Encrypt, port 443; the provider's firewall blocks other new ports such as 8090). The lab and demo sign-in are off there. Deploy with `server/deploy.sh`, HTTPS with `server/publish.sh`; read-only checks with `server/inspect.sh` / `check.sh`. See [18-hosting-server.md](18-hosting-server.md). Root password was shared in chat: change it. | Project lead |
| 2026-11-13 | **PLAR moved to the team's OVH project server** (the manager confirmed OVH is where projects go): **https://plar.airl.ca**, deployed with the server's `hz` tool like the other airl.ca projects (`/opt/projects/plar`, `127.0.0.1:9004`, `hz proxy` + Let's Encrypt). `server/deploy.sh` and `publish.sh` now target OVH (`hh_horaizon`, key login). The IONOS copy was removed the same day. Change the `hh_horaizon` password (shared in chat). See [18-hosting-server.md](18-hosting-server.md) Part A. | Project lead / manager |
| 2026-11-13 | **Verification lab live and open:** `/verify` and `/testing` switched on at https://plar.airl.ca with no sign-in for now (sign-in to follow), linked from the home page. Captures in a Docker volume on the OVH server; the AI check runs there with the OpenRouter key in the server's `.env.local`. Deploys: commit, push to GitHub (glatif/PLAR, SSH as Singh-Gursahib), then `server/deploy.sh` and `server/check.sh`. | Project lead |
| 2026-11-19 | **Six roles only, for now:** student, advisor (advisors also book interviews: no separate coordinator), assessor (chair or writer), PLAR Manager, PLAR Director and admin. Migration `20261119174054_six_roles` rebuilt `app_role` without `coordinator`; managers, directors and admins see every case; only admins grant roles. Each role has its own workspace. 8 demo accounts (password `demo1234`, synthetic only). **"Sign in with Microsoft" is a demo** for now (a picker of the demo accounts); the code path for TRU's Microsoft Entra ID is in place (`MICROSOFT_SIGN_IN=entra`, Supabase Azure provider, `/auth/callback`) but not set up or tested. Demo sign-in is **on at https://plar.airl.ca**. The admin workspace has a **Roles and access** page (purpose and access of each role) to show stakeholders. The existing `plar-dev` project is kept as the one Supabase project. The admin workspace also links to the identity check test (`/verify`) and results (`/testing`) for manual testing. | Project lead |
| 2026-11-19 | **Each project has its own Supabase.** PLAR's runs on the OVH server as the hz project `plar-api` (`/opt/projects/plar-api`, gateway `127.0.0.1:9007`, containers `plar-api`, `plar-api-auth`, `plar-api-rest`, `plar-api-db`), separate from Living Heritage's (`/opt/supabase`, which is Heritage's own by design). Trimmed upstream setup (gateway, Auth, REST, Postgres; same image tags as Heritage's). Sign-up off, autoconfirm off. Secrets made on the server, in its `.env` only. Nightly `pg_dumpall` at 03:45 from hh_horaizon's crontab into `~/backups/plar-api` (14 days; same disk, so an off-server copy is still needed). Managed with `server/plar-api.sh`. **Waiting on:** an A record `plar-api` → `144.217.80.160` at Porkbun (only the airl.ca account holder can add it; the server session has no Porkbun access), then `./plar-api.sh publish` in a terminal (sudo password). Until then the web app still uses the cloud project `plar-dev`. OVH data residency (Canada) not yet confirmed. | Project lead |
| 2026-11-19 | **Admin manages people in the portal:** add people with roles and a temporary password, change roles (promote), reset passwords, deactivate and reactivate, sign out everywhere, edit name and email, and delete people with no case records. Security-definer database functions check the admin role (migration `20261119190000_people_admin`), so no service key is needed; every change is written to `admin_events`. New and reset accounts must choose their own password at sign-in (`/account/password`, enforced in `proxy.ts`); anyone can change their password there. A deactivated person's existing access token can still read data until it expires (up to 1 hour); their sessions end at once. | Project lead |
| 2026-10-22 | Keep **documented facts**, **assumptions** and **proposals** visibly separate in every doc. | Project lead |

## Key findings to remember

1. **The interview belongs to Project #1.** Phasing between the projects is not stated. See [11 §1](11-scope-and-ai-analysis.md#1-priority-and-phasing-assessment-interviews-and-coaching).
2. **AI scoring and AI-conducted interviews are not in any source.** The handbook stresses holistic human judgement (P1-B p.33), and policy ED-2.0 gives the decision to faculty (P1-B p.3). Treat both as open decisions (Q-SCOPE-2, Q-INT-1).
3. **The approval and assessor-assignment roles conflict** between the Manager and the Director across sources. RBAC must be configurable until Q-ROLE-1 and Q-ROLE-2 are answered.
4. **The standard comments library has 279 entries in 14 sections** and is reused word for word (P2-D, P2-C).
5. **The readiness questionnaire's platform is unknown.** Its auto-response exists but is inactive (P2-A step 2).
6. **The assessment is already structured** (rubric, I/S/O, scale), but the final judgement is deliberately discretionary.
7. **Sensitive data:** student portfolios are confidential. Don't put real student content into AI tools or test data without approval (Q-PRIV-5).

## Status and next steps

- [x] Read all source documents, including OCR of the three scanned PDFs.
- [x] Build the documentation set and the stakeholder questions.
- [x] Project lead reviews the docs (approved 2026-10-22).
- [x] Draft the feature list, design system and technical approach (13, 14, 15).
- [x] Feature list approved (2026-10-29).
- [x] **M0 started:** `web/` scaffold, design tokens, homepage, sign-in placeholder, workspace shell with role previews (synthetic data).
- [x] Git initialised (2026-10-29).
- [x] **Week 1, Supabase (2026-11-05):** hosted dev project `plar-dev` (ref `dxnurogvpdxtbaocallr`, Canada Central, **free plan for now**). `supabase/` folder with config, the foundation migration (private helpers, `app_role`, profiles, role assignments, row-level security), a synthetic seed and pgTAP tests. The `harness/` folder holds doctor, API and security checks, type generation and push scripts. The web app has typed Supabase clients and env files. Security checks pass on hosted dev; the security advisor reports nothing.
- [x] **Pulled forward from week 2 (2026-11-05):** cases schema (programs, cases, assessor pairs, journey events, tasks, interviews) with per-role access rules; 9 demo accounts and synthetic data; real sign-in (email and password, one-click demo accounts), sign-out and session handling; each workspace now shows live data. `npm run check` passes 19 of 19 checks per role.
- [ ] Week 1 remaining: Prettier, Vitest, Playwright, CI, deployment (needs the server and domain), core UI components.
- [ ] Revoke the Supabase access token that was pasted into chat on 2026-11-05 (the connector doesn't need it).
- [x] **Six roles and Microsoft demo sign-in (2026-11-19):** see the decision above. `npm run check` passes 18 of 18; the new pgTAP role test passes 8 of 8 (run on hosted dev inside a rolled-back transaction).
- [ ] M1: rest of the schema, TRU Microsoft Entra ID sign-in (needs TRU IT: app registration, tenant, redirect URL), case record, audit log.
- [ ] Supervisor reviews the features document. Schedule a discussion with the supervisor and the PLAR department.
- [ ] Evaluate LLM options against the requirements in 15 §3.3.
- [ ] Prepare the stakeholder-facing documents: proposal, timeline and the questions.
- [ ] Record stakeholder answers in [stakeholder-questions.md](stakeholder-questions.md) and update the affected docs.

## Building shareable PDFs

- Run `Resources/docs/assets/build-pdf.sh`. It renders `13-features.md` and `14-design-system.md` to `pdf/` using `assets/print.css` and the full-bleed cover pages in `assets/covers/` (no version or audience on covers, per the project lead).

## Source-reading notes

- Extracted text and OCR output were kept only in a temporary scratch area. Re-extract from the originals if needed: use `pdftotext -layout` for PDFs, `textutil` or `pandoc` for `.docx`, and `tesseract` for the scanned PDFs (P2-I, P2-M, P1-SP1).
- The two rubric copies (P1-I and P2-F) are identical, as are the two Bloom's copies (P1-H and P2-G).
