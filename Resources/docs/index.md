# PLAR Platform: Documentation Index

This is the entry point to the project documentation for the TRU Open Learning **PLAR Competency-based Portfolio** efficiency platform. Everything here is drawn from the stakeholder email and documents in `Resources/`. Every statement cites its source using the IDs defined in [00-sources.md](00-sources.md).

**Status:** discovery and requirements analysis. No features have been agreed yet. Last updated 2026-10-22 (v0.2: features, design system and technical approach added).

## Start here

| File | What it covers |
|---|---|
| [project-context.md](project-context.md) | Working notes for the project team: decisions so far, documentation conventions, current status and next steps. |
| [00-sources.md](00-sources.md) | Register of every source document, with its Source ID, link, purpose and date, plus the page-citation conventions and handling rules. |
| [01-project-overview.md](01-project-overview.md) | The client, what a Competency-based Portfolio is, the two projects and their priorities, and our team's intended direction (kept separate from what the stakeholders said). |
| [02-terminology.md](02-terminology.md) | Glossary and acronyms, and the analysis of **Demonstration of Learning vs Discussion of Learning** and other naming inconsistencies. |

## How PLAR works today

| File | What it covers |
|---|---|
| [03-portfolio-structure.md](03-portfolio-structure.md) | The 7 portfolio components and their rules, evidence numbering, how files are submitted and moved today, and the writing guidance students receive. |
| [04-competencies-rubric-and-credit.md](04-competencies-rubric-and-credit.md) | The 8 competencies, the rubric and worksheet fields, Bloom's and Webb's, I/S/O rating rules, and how the credit award is determined. |
| [05-end-to-end-workflow.md](05-end-to-end-workflow.md) | The full student journey, step by step: who does each step, with which systems, and what comes next. Each step is marked documented, partly documented, conflicting or assumed. |
| [06-assessment-workflow.md](06-assessment-workflow.md) | **Project #1.** Assessor activities before, during and after the meetings: the inputs and outputs at each step, with proposed improvements kept separate. |
| [07-advising-and-feedback.md](07-advising-and-feedback.md) | **Project #2.** The advisor's 15 steps, the feedback rounds, the tone rules, and how the **standard comments library** (279 entries) is used, with proposed AI comment suggestions. |
| [08-communications-scheduling-records.md](08-communications-scheduling-records.md) | Reminders, interview scheduling, report routing, credit recording, document collection and every standard communication, each split into existing and proposed. |
| [09-roles-and-permissions.md](09-roles-and-permissions.md) | Roles and their documented responsibilities, **conflicts over approval and assessor assignment**, and a draft RBAC matrix. |
| [10-principles-and-constraints.md](10-principles-and-constraints.md) | The non-negotiables (learning not experience, human judgement, independence, bias, cultural safety, integrity, audit trail, privacy, accessibility) and what each means for design. |

## Analysis and decisions

| File | What it covers |
|---|---|
| [11-scope-and-ai-analysis.md](11-scope-and-ai-analysis.md) | What is stated and what is assumed on: phasing, AI scoring, **AI multimodal interviews**, the **readiness questionnaire**, and document management. |
| [12-automation-opportunities.md](12-automation-opportunities.md) | A register of every manual step and its automation or AI opportunity, each with a status (stated priority, documented gap, team decision or proposed). |
| [stakeholder-questions.md](stakeholder-questions.md) | **Questions for the stakeholders**, grouped by topic and tagged by who should answer, each with why it matters and the source of the ambiguity. |

## Proposal and design

| File | What it covers |
|---|---|
| [13-features.md](13-features.md) | **The feature list, for stakeholders.** Plain-language features in 11 categories: what each does and who it helps, our commitments, how identity verification works, and an appendix tracing each feature to its sources. |
| [14-design-system.md](14-design-system.md) | **The design system** ("Calm Glass"): Apple-inspired, with teal accents. Colour (contrast-checked), typography, spacing, radii, glass, motion, components, the interview room, and print/PDF/email standards. |
| [16-implementation-plan.md](16-implementation-plan.md) | **The implementation plan**: engineering principles, repository layout, architecture decision log, milestones M0–M7 with exit criteria and blocking questions, draft data model, testing and Definition of Done, security checklist and AI engineering approach. |
| [15-technical-approach.md](15-technical-approach.md) | Architecture; the **built-in interview room with Zoom as a fallback**; **LLM options (the Microsoft Copilot ecosystem, or a proprietary multimodal endpoint)** and the **mandatory no-training privacy requirements**; the identity-verification design. |
| [17-identity-verification.md](17-identity-verification.md) | **Identity verification lab** (built): face photo, head movement and ID capture, background straightening, **success and failure states**, the lab AI check, and how to test. |
| [18-hosting-server.md](18-hosting-server.md) | **Hosting servers**: PLAR runs on the team's OVH project server at https://plar.airl.ca (deployed with `hz`); also what runs on the older IONOS server, risks noticed, and the `server/` harness. |

**PDF versions** (styled with the design system): [pdf/13-features.pdf](pdf/13-features.pdf) · [pdf/14-design-system.pdf](pdf/14-design-system.pdf). Print stylesheet: [assets/print.css](assets/print.css).

## How to use these docs while building

- Before building a feature, find it in [12-automation-opportunities.md](12-automation-opportunities.md) and check its **status**. Only stated priorities and confirmed answers count as requirements.
- Follow the Source IDs back to the original document to see **why** a rule exists.
- When a stakeholder answers a question, record the answer and date under that question in [stakeholder-questions.md](stakeholder-questions.md), then update the affected pages.
