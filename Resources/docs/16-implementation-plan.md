# Implementation Plan

How we will build the approved feature list ([13-features.md](13-features.md)). This is an internal engineering plan: it uses question IDs and file references freely. **Do not share it as-is**; the shareable summary goes in a proposal document.

[← Back to index](index.md)

> **Status:** v1.0, 2026-10-29. The feature list is approved (project lead, 2026-10-29). Work starts with Milestone 0 (foundation and homepage). Anything that depends on an open stakeholder answer is built **behind a feature flag or configuration setting**, so building can continue without waiting.

---

## 1. Engineering principles

1. **People decide.** No code path lets AI award credit, set a rating or message a student. AI output is always stored as a *suggestion* and has to be accepted by a named user ([10 §2](10-principles-and-constraints.md#2-human-expert-judgement-decides-the-award)).
2. **Configurable where the sources disagree.** Who approves, who assigns, who releases, reminder schedules, accepted ID types and retention periods are all settings, not hard-coded rules ([09 §3](09-roles-and-permissions.md#3-conflicts)).
3. **Privacy by default.** Least-privilege access per case. No student content in logs. Short-lived storage for ID images. Every sensitive action audited ([15 §3.3](15-technical-approach.md#33-mandatory-requirements-for-any-ai-service)).
4. **Provider-neutral AI.** All AI calls go through one gateway. Until an approved provider exists, only a **mock adapter** with synthetic data runs ([15 §3.4](15-technical-approach.md#34-how-we-will-choose)).
5. **The design system is the UI contract.** Tokens come from [14-design-system.md](14-design-system.md), every component meets WCAG 2.2 AA, and a component isn't done until it passes the accessibility checks.
6. **Small, reviewable increments.** Each milestone ends with something demonstrable.

## 2. Repository layout

```
PLAR-Project/
├── CLAUDE.md                 project rules for the AI assistant
├── .gitignore                excludes Resources/General (confidential), env files, build output
├── Resources/
│   ├── project-email.md      stakeholder email (source)
│   ├── General/              stakeholder documents — CONFIDENTIAL, never committed
│   └── docs/                 project documentation (this folder)
└── web/                      the Next.js application
    ├── src/app/              routes (App Router)
    │   ├── page.tsx          public homepage
    │   ├── sign-in/          sign-in entry (placeholder until SSO is configured)
    │   └── (app)/            authenticated area: shell + role dashboards
    ├── src/components/       design-system components (ui/) and page sections
    ├── src/lib/              domain types, config, (later) data access, AI gateway
    └── src/app/globals.css   design tokens (light, dark, reduced transparency)
```

## 3. Architecture decisions (ADR log)

| # | Decision | Status | Notes / dependency |
|---|---|---|---|
| ADR-001 | **Next.js (App Router) + TypeScript**, single web app in `web/` | Accepted | Project lead |
| ADR-002 | **Tailwind CSS v4** with design tokens as CSS variables; self-built accessible primitives | Accepted | [14](14-design-system.md) |
| ADR-003 | ~~PostgreSQL + Prisma~~, with pgvector for the comment library | Superseded by ADR-010 | Host region per Q-PRIV-1 |
| ADR-004 | **Auth**: Microsoft Entra ID SSO for staff and assessors; email link or TRU sign-in for students | Superseded by ADR-011 | Q-SYS-1, Q-ASSESS-6 |
| ADR-005 | **AI gateway** with swappable adapters; mock adapter only until a provider is approved | Accepted | Q-AI-7; [15 §3](15-technical-approach.md#3-llm-integration-provider-options-and-privacy-requirements) |
| ADR-006 | **Built-in interview room** on WebRTC with a self-hosted SFU in Canada; Zoom fallback | Proposed | Q-INT-7 |
| ADR-007 | **Hosting**: a container in a Canadian region (TRU Azure or a managed Canadian provider) | Superseded by ADR-012 | Q-SYS-4, Q-PRIV-1 |
| ADR-008 | **Background jobs** on a Postgres-backed queue (reminders, AI batches, email, deletions) | Accepted (M1) | Implemented with Supabase Queues and Cron (ADR-010) |
| ADR-009 | **Documents**: object storage (Canada), Word→PDF conversion, the shared print stylesheet for generated PDFs | Accepted (M2) | Storage is Supabase Storage (ADR-010); styles from [design-system.html](design-system.html) |
| ADR-010 | **Supabase** (Canada (Central) region) as the backend: Postgres with row-level security, Auth, Storage, Queues and Cron, Realtime, pgvector. Schema changes as Supabase CLI migrations with generated TypeScript types (no Prisma). Separate dev, staging and production projects. | Accepted (2026-10-31) | Project lead. Paid plan assumed for backups and SSO |
| ADR-011 | **Auth via Supabase Auth**: Microsoft Entra ID for staff and assessors, email link for students, a development-only demo login | Proposed | Needs the TRU IT app registration (Q-SYS-1) |
| ADR-012 | **Hosting**: the Next.js app on our own server in Canada with a proper domain and HTTPS; staging auto-deploys, production is released on purpose | Accepted (2026-10-31) | Project lead. Provider and domain to be named |

New decisions get a row here. Superseded ones are marked, never deleted.

## 4. Milestones

**Dated schedule:** [timeline.html](timeline.html) maps these milestones onto 17 weeks, 1 November 2026 → 28 February 2027, with tasks, sub-tasks and day estimates.

The order follows the stakeholders' priority (assessment first, then advising) [EMAIL], after the foundation. Each milestone lists what it delivers, its exit criteria, and the questions that could change it.

### M0: Foundation and homepage ← **in progress**

- **Delivers:** the `web/` scaffold; design tokens (light, dark, reduced transparency, increased contrast); base components (Button, Card, Badge, Glass bar, Section); the public homepage; a sign-in page placeholder; the authenticated app shell with role dashboard placeholders; lint, typecheck and production build passing; `.gitignore` protecting confidential sources.
- **Exit:** the homepage and shell render in light and dark mode at mobile and desktop widths; keyboard navigation works; build passes.
- **Questions:** Q-DS-1 (TRU branding may change colours or logo later).

### M1: Core platform

- **Delivers:** the database schema (§5); authentication (a development login first, then SSO); RBAC with configurable approval and assignment roles; the case record and journey timeline; the audit log; notifications (email in development via a local mail catcher); the admin area for users, roles and settings; feature flags.
- **Exit:** a seeded demo with synthetic students, advisors and assessors; every role sees only its own data; audit events are written for sensitive actions.
- **Questions:** Q-ROLE-1…5, Q-SYS-1, Q-FLOW-2.

### M2: Assessment workspace (Project #1)

- **Delivers:**
  - portfolio import (advisor uploads the final files)
  - the document viewer
  - the digital rubric worksheet, with ratings kept private until both assessors submit
  - the prep space
  - interview question suggestions (mock AI)
  - the AI evidence map (mock AI, behind a flag)
  - the consensus screen and credit-range guide
  - report drafting (mock AI) with tone and consistency checks
  - chair review
  - the decision workflow (submit → log → review → decide → release)
  - the PDF report in the design system
- **Exit:** an end-to-end assessment of a synthetic portfolio by two demo assessors, ending in a released report.
- **Questions:** Q-SCOPE-2, Q-AI-1…4, Q-ASSESS-1…6, Q-TERM-1.

### M3: Interviews

- **Delivers:**
  - scheduling (availability, slot matching, invitations, Letters 1 and 2)
  - the built-in interview room (WebRTC, audio-only mode, reconnect, captions behind a flag)
  - the interview companion
  - identity verification (capture, quality checks, verifier review, automatic deletion; AI assist behind a flag)
  - the Zoom fallback
  - recording (behind a flag)
- **Exit:** a full mock interview run across two browsers, with ID verification and notes captured.
- **Questions:** Q-INT-1…8, Q-PRIV-2, Q-PRIV-6, Q-SYS-2.

### M4: Advising and feedback (Project #2)

- **Delivers:**
  - student portfolio upload and progress tracker
  - in-browser review and comments
  - the standard comments library (import of the 279 entries) and suggestions
  - automatic checklist checks
  - round summaries
  - extensions
  - **automated reminders** (6/12/20/24 weeks)
  - the ready-for-assessment approval queue
- **Exit:** a synthetic student goes from first upload to "approved for assessment", with reminders firing on schedule.
- **Questions:** Q-DOC-1…4, Q-FB-1…6, Q-AUTO-1.

### M5: Intake and operations

- **Delivers:** the readiness questionnaire with stored results and the auto-response (behind a flag); resume intake; onboarding with the e-signed authenticity statement; payment status; the credit-entry export; the insights dashboard; retention jobs.
- **Questions:** Q-QUEST-1…4, Q-FLOW-3, Q-AUTO-3, Q-AUTO-4, Q-PRIV-3.

### M6: AI provider integration and hardening

- **Delivers:** the provider evaluation against R1–R9 ([15 §3.3](15-technical-approach.md#33-mandatory-requirements-for-any-ai-service)); the production adapter; an evaluation set on anonymised data and a bias review; an accessibility audit; a security review and penetration test; privacy impact assessment support; load tests for the interview room.
- **Questions:** Q-AI-7, Q-PRIV-1, Q-PRIV-5.

### M7: Pilot and rollout

- **Delivers:** a pilot with a small group of advisors, assessors and students; role-based user guides; video walkthroughs; a training mode for new assessors; a go-live checklist.

## 5. Data model (draft, refined in M1)

| Entity | Purpose | Key fields |
|---|---|---|
| User | A person with access | name, email, status, SSO subject |
| RoleAssignment | What a user may do | user, role (student/advisor/coordinator/assessor/manager/director/admin), scope |
| Case | One student's PLAR journey | student, program, LL/UL credit room, status, due date, advisor |
| ProgramPlanSnapshot | The credits on record when the case was assessed | case, credits applied, remaining, file |
| PortfolioSection | CL, ToC, AR, IoL, DoL, EDL, EV | case, type, current version, review state |
| DocumentVersion | Uploaded file versions | section, file, uploaded by, created at |
| EvidenceItem | Numbered evidence | case, number (e.g. 3.2), title, caption (5 Ws), competencies |
| Comment / ReviewRound | Advisor feedback | anchor (document + range), text, standard-response source, round |
| StandardResponse | The 279-entry library | section, competency, text, placeholders, version |
| AssessmentAssignment | The assessor pair | case, assessor, role (chair/writer), assigned by |
| RubricVersion / Criterion | CC2.0 criteria | competency, level (LL/UL), text, examples |
| CriterionMark | An assessor's tick | assignment, criterion, state (none/partial/full), evidence link, note |
| CompetencyRating | I/S/O | case, competency, level, stage (preliminary/final), assessor or consensus |
| InterviewSession | The Discussion of Learning | case, schedule, room, mode (built-in/Zoom/phone), status |
| IdentityVerification | The ID check before the interview | session, method, outcome, verifier, image expiry (images in short-lived storage) |
| InterviewNote | Notes for each competency | session, assessor, competency, text |
| Report / Decision | The outcome | draft versions, consensus credits, approver, released at |
| Reminder / Notification | Messages | case, template, due at, sent at |
| AIInteraction | AI audit | feature, prompt version, adapter, input refs, output, accepted/edited by |
| AuditEvent | Append-only log | actor, action, subject, at, metadata |

## 6. Quality, testing and Definition of Done

- **Tooling:** TypeScript strict mode; ESLint; Prettier; Vitest for units; Playwright end-to-end tests (from M1); axe accessibility checks in end-to-end tests; a CI pipeline once the repository is set up.
- **Definition of Done** for a feature:
  1. It meets the acceptance criteria.
  2. Unit and end-to-end tests are written where it makes sense.
  3. It passes the accessibility checks (keyboard, contrast, screen-reader labels).
  4. It works in light and dark mode and at mobile width.
  5. Every sensitive action writes an audit entry.
  6. No student data appears in logs.
  7. The docs are updated.
- **Test data:** synthetic only. Real student materials from `Resources/General/` are **never** used in code, seeds or tests without explicit approval (Q-PRIV-5).

## 7. Security and privacy engineering checklist (ongoing)

- [ ] Secrets only in environment variables or a vault; `.env*` is git-ignored.
- [ ] Per-case authorisation checks on the server for every read and write.
- [ ] Security headers (CSP, HSTS, frame-ancestors) and CSRF protection.
- [ ] Encryption at rest (database, storage); signed, short-lived file URLs.
- [ ] Deletion jobs for ID images and retention rules, with logged deletion.
- [ ] Log scrubbing of student content and identifiers.
- [ ] Dependency scanning; pinned versions.

## 8. AI engineering approach

- One interface in `src/lib/ai/`. A feature asks the gateway for a capability, such as `suggestComments`, `mapEvidence`, `draftReport` or `assistIdCheck`. It never calls a provider directly.
- Adapters: `mock` (synthetic, deterministic; the default), plus one production adapter added after the evaluation.
- Every call records an `AIInteraction`. Outputs are schema-validated. Portfolio text is treated as untrusted input.
- Every AI feature has its own flag, and all are **off** until approved.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Stakeholder answers change scope (AI scoring, AI interviews, document handling) | Feature flags and configurable roles; build the flow, not the policy |
| Reliability of the built-in interview room | Device check, reconnect, audio-only, phone dial-in, Zoom fallback, load tests |
| No approved AI provider when the features are ready | The mock adapter keeps features demonstrable; the evaluation starts in parallel |
| Privacy approval delays (PIA) | Start the PIA early with the Privacy Office; minimise data from day one |
| TRU branding requirements | Tokens are centralised, so a re-theme is one file |

## 10. Working agreements

- The project lead (Samar) approves scope. Claude implements and asks when a decision is needed.
- Every milestone ends with a demo and a status update in [project-context.md](project-context.md).
- Commits and pushes only on request. The repository isn't initialised yet: run `git init` when ready (the `.gitignore` already protects the confidential sources).
