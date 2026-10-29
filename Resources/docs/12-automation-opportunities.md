# Automation and AI Opportunities Register

A single list of every manual step found in the sources, with the matching opportunity and its **status**. This is the input to the next discussion (features, capabilities and tech stack). **None of these is an approved requirement** unless its status says so.

[← Back to index](index.md)

**Status values**

| Status | Meaning |
|---|---|
| **Stated priority** | The stakeholders asked for efficiency in this area [EMAIL] |
| **Documented gap** | The sources themselves point out something unfinished or awkward |
| **Team decision** | Our project lead has decided to offer it; stakeholders confirm the details |
| **Team preference / request** | Our project lead wants it proposed as the preferred option; stakeholders must approve |
| **Proposed** | Our idea; needs stakeholder approval |

## Project #1: Assessment (stated top priority)

| ID | Manual step today | Source | Opportunity | Status | Detail / question |
|---|---|---|---|---|---|
| A-01 | Assessors download portfolios from Moodle; some files fail to open | P1-B p.19; P1-A step 2 | In-platform portfolio viewer with automatic file checks | Proposed | [06 B1](06-assessment-workflow.md#part-b-opportunities-proposed-needing-stakeholder-confirmation) · Q-DOC-1 |
| A-02 | Word rubric worksheet filled in by hand, with green/yellow highlighting | P1-C; P1-B p.34 | Digital rubric with criteria linked to evidence; ratings kept private until both assessors submit | Proposed | 06 B2 · Q-ASSESS-2 |
| A-03 | Manual mapping of portfolio content to criteria and Bloom's levels | P1-B p.20, p.30–34 | AI evidence map with citations (assistive) | Proposed | 06 B3 · Q-SCOPE-2, Q-AI-1/2 |
| A-04 | Questions chosen from a 2020 bank and customised by hand | P1-D; P1-B p.36–37 | AI-suggested portfolio-specific questions | Proposed | 06 B4 · Q-AI-3 |
| A-05 | Question-exchange document put together by email | P1-B p.21 | Auto-assembled prep document | Proposed | 06 B5 · Q-ASSESS-3 |
| A-06 | Script filled in by hand; notes taken by hand | P1-E; P1-C | Pre-filled script and interview note-taker | Proposed | 06 B6 · Q-INT-3 |
| A-07 | No recording or transcript | (absence in all sources) | Recording or transcription (with consent) | Proposed | 06 B7 · Q-INT-2 |
| A-08 | Human-conducted interview | P1-B p.23; P2-I p.67 | AI practice, AI-assisted, or AI-conducted interview | **Asked of our team; not in the sources** | [11 §3](11-scope-and-ai-analysis.md#3-ai-powered-multimodal-interviews) · Q-INT-1 |
| A-09 | Consensus and credit calculation done by hand against the scale | P1-B p.24, p.35; P1-G | Consensus screen and calculator showing a range, with a required rationale | Proposed | 06 B9 · Q-ASSESS-4 |
| A-10 | Report written from a Word template and phrase inventory | P1-F; P1-B App. E | AI draft report with tone and congruence checks | Proposed | 06 B10–B11 · Q-AI-4 |
| A-11 | Chair reviews in Word track changes | P1-B p.26 | In-platform review and versioning | Proposed | 06 B11 |
| A-12 | Report emailed to PLAR@tru.ca, then logged by hand | P1-B p.26 | Workflow routing, status tracking and SLA reminders | Proposed | 06 B12 · Q-ROLE-3 |
| A-13 | Notes kept 2 years under each assessor's own control | P1-B p.21, p.26 | Central retention with a destruction policy | Proposed | 06 B13 · Q-PRIV-3 |
| A-14 | No automatic integrity checks | P1-B p.23, p.41 | Integrity aids (claim verification prompts; policy on detecting AI-written text) | Proposed | Q-AI-6 |
| A-15 | Interviews on Zoom or teleconference; advisor connects the call by hand | P2-I p.67; P1-B p.121 | **Built-in interview room** (preferred), with **Zoom as the fallback** | **Team preference** (to confirm) | [15 §2](15-technical-approach.md#2-interview-platform-our-own-room-preferred-with-zoom-as-a-fallback) · Q-INT-7 |
| A-16 | Identity confirmed verbally by the chair | P1-E; P1-B p.23, p.41 | **Photo-ID verification** before the interview: AI-assisted, a person decides, images deleted promptly | **Team request** (to confirm) | [15 §4](15-technical-approach.md#4-identity-verification-technical-design) · Q-INT-6, Q-INT-8, Q-PRIV-6 |

## Project #2: Advising and feedback (stated next priority)

| ID | Manual step today | Source | Opportunity | Status | Detail / question |
|---|---|---|---|---|---|
| F-01 | Readiness questionnaire on an unnamed online tool; results followed up by hand | P2-A step 2; P1-B p.7–8 | Questionnaire in the platform, with stored results and an advisor view | Proposed | [11 §4](11-scope-and-ai-analysis.md#4-the-48-question-readiness-questionnaire) · Q-QUEST-1…4 |
| F-02 | Auto-response built but **not activated** | P2-A step 2 | Turn on the automatic candidacy feedback | **Documented gap** (activation needs approval) | Q-QUEST-3 |
| F-03 | AR received and reviewed by email | P2-I p.10; P2-A step 3 | Intake form with a review queue | Proposed | Q-FLOW-2 |
| F-04 | Payment information sent; registration done by "email to Records" | P2-A step 4 | Payment link or status tracking; structured registration request | Proposed | Q-FLOW-3, Q-SYS-1 |
| F-05 | Moodle access granted by hand; welcome email written by hand | P2-A step 5; P2-B PDF p.15–16 | Automated onboarding, including the e-signed authenticity statement | Proposed | Q-FLOW-4 |
| F-06 | Due date and four reminders set in Outlook | P2-A step 6; P2-I p.7 | **Automated reminder schedule** | **Team decision** | [08 §1](08-communications-scheduling-records.md#1-reminders-and-due-dates) · Q-AUTO-1 |
| F-07 | Files downloaded from Moodle and uploaded again; drafts sent by email | P2-A step 7; P2-I p.62 | In-platform upload, review, comments and notifications | Proposed | [08 §4](08-communications-scheduling-records.md#4-document-collection-review-and-communication) · Q-DOC-1…4 |
| F-08 | Comments pasted from a 279-entry Word library | P2-D; P2-C | AI-ranked comment suggestions (top ~10) | Proposed | [07 B1](07-advising-and-feedback.md#part-b-opportunities-proposed-needing-stakeholder-confirmation) · Q-FB-1/2 |
| F-09 | Checklist checks done by hand | P2-E | Automatic checklist validation | Proposed | 07 B3 · Q-FB-3 |
| F-10 | Round-summary emails written by hand | P2-B | Draft summary built from the chosen comments | Proposed | 07 B5 · Q-FB-5 |
| F-11 | Extension requests made on a form by email | P2-I p.64 | In-platform extension request that resets the due date | Proposed | Q-AUTO-1 |
| F-12 | Portfolio sent for approval by email | P2-A step 10 | Approval queue | Proposed | Q-ROLE-1 |
| F-13 | Monthly availability poll; matching four schedules by email | P1-B p.18, p.120; P2-A step 11 | Scheduling module with invites to the built-in interview room (Zoom only as fallback) | Proposed | [08 §2](08-communications-scheduling-records.md#2-interview-scheduling) · Q-AUTO-2 |
| F-14 | Interview letters 1 and 2 written by hand | P1-B p.120–121 | Templated automatic sends | Proposed | Q-AUTO-2 |
| F-15 | Results sent by email; credit entry requested from Records by hand | P2-A steps 14–15 | Release workflow plus a structured credit-entry export | Proposed | [08 §3](08-communications-scheduling-records.md#3-report-routing-and-credit-recording) · Q-AUTO-3 |
| F-16 | Statistics collected by hand "for various PLAR reports" | P1-B p.11 | Reporting dashboard | Proposed | Q-AUTO-4 |
| F-17 | Student-side writing support from static PDFs | P2-J; P2-M; P2-O | AI reflection coach that prompts and never writes | Proposed | 07 B7 · Q-AI-5 |

## Cross-cutting

| ID | Opportunity | Status | Question |
|---|---|---|---|
| X-01 | Role-based access with configurable approval and assignment roles | Required by any platform; the role holders are unclear | Q-ROLE-1…5 |
| X-02 | Integrations: Moodle, Outlook/M365, Zoom (fallback only), Banner, DegreeWorks, TRU single sign-on | Proposed | Q-SYS-1…4 |
| X-06 | **AI provider selection** under the mandatory no-training and privacy requirements. Options: the Microsoft Copilot ecosystem, or a proprietary multimodal model through a protected endpoint. **No provider has been chosen.** | Team decision | [15 §3](15-technical-approach.md#3-llm-integration-provider-options-and-privacy-requirements) · Q-AI-7 |
| X-07 | **Design system** for the platform and all documents | Team decision | [14-design-system.md](14-design-system.md) · Q-DS-1 |
| X-03 | Audit log, retention and privacy controls | Implied by P1-B p.25–26, p.44 | Q-PRIV-1…4 |
| X-04 | Role-specific user documentation and a video walkthrough | Team plan | — |
| X-05 | Accessibility (WCAG) and alternatives to AI interactions | Implied by P1-B p.41; P2-I p.67 | Q-PRIV-4 |
