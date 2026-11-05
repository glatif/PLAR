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
- [ ] Week 1 remaining: staging and production projects (need a paid plan or a second org), Prettier, Vitest, Playwright, CI, deployment (needs the server and domain), core UI components.
- [ ] Local Supabase stack: blocked because Colima isn't forwarding new ports. Run `colima restart` when the other local stack (`lvi-console`) can pause, then `npm run local:start` and `npm run test` in `harness/`.
- [ ] Revoke the Supabase access token that was pasted into chat on 2026-11-05 (the connector doesn't need it).
- [ ] M1: rest of the schema, auth/SSO, case record, audit log.
- [ ] Supervisor reviews the features document. Schedule a discussion with the supervisor and the PLAR department.
- [ ] Evaluate LLM options against the requirements in 15 §3.3.
- [ ] Prepare the stakeholder-facing documents: proposal, timeline and the questions.
- [ ] Record stakeholder answers in [stakeholder-questions.md](stakeholder-questions.md) and update the affected docs.

## Building shareable PDFs

- Run `Resources/docs/assets/build-pdf.sh`. It renders `13-features.md` and `14-design-system.md` to `pdf/` using `assets/print.css` and the full-bleed cover pages in `assets/covers/` (no version or audience on covers, per the project lead).

## Source-reading notes

- Extracted text and OCR output were kept only in a temporary scratch area. Re-extract from the originals if needed: use `pdftotext -layout` for PDFs, `textutil` or `pandoc` for `.docx`, and `tesseract` for the scanned PDFs (P2-I, P2-M, P1-SP1).
- The two rubric copies (P1-I and P2-F) are identical, as are the two Bloom's copies (P1-H and P2-G).
