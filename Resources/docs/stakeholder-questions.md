# Stakeholder Questions

These are the questions the source documents do **not** answer clearly. They are grouped by topic. Each one says **who should answer it**, **why it matters** (the design decision that depends on it), and **where the ambiguity comes from**.

Questions the sources already answer have been left out. For example: the interview is part of the assessor process; there are four reminders, at weeks 6, 12, 20 and 24; ratings are I/S/O at lower and upper level.

[← Back to index](index.md)

## Who answers what

| Audience | Questions |
|---|---|
| **PLAR Director** (final authority on awards and policy) | Q-SCOPE-1, 2, 4, 5 · Q-INT-1, 2, 4, 6, 7, 8 · Q-QUEST-2, 3 · Q-DOC-1 · Q-FB-2, 4 · Q-ASSESS-4, 5 · Q-AI-1, 2, 4, 5, 6, 7 · Q-TERM-1 · Q-ROLE-1, 2, 3, 5 · Q-PRIV-2, 3, 5, 6 · Q-LOG-1, 2, 3 · Q-DS-1 |
| **PLAR Manager** (day-to-day operations) | Q-SCOPE-1, 3, 4 · Q-FLOW-5, 6 · Q-DOC-1 · Q-FB-6 · Q-ASSESS-5 · Q-AUTO-3, 4 · Q-ROLE-1, 2, 3 |
| **PLAR Advisors** (incl. the booking coordinator) | Q-INT-5, 8 · Q-FLOW-1, 2, 3, 4 · Q-QUEST-1, 3, 4 · Q-DOC-1, 2, 3, 4 · Q-FB-1 … 6 · Q-AUTO-1, 2 · Q-TERM-1 |
| **PLAR Assessors** (a representative group) | Q-SCOPE-2 · Q-INT-3 · Q-ASSESS-1, 2, 3, 6 · Q-AI-2, 3, 4 · Q-ROLE-4 |
| **TRU IT / Learning Technology** | Q-SCOPE-3 · Q-FLOW-4 · Q-SYS-1, 2, 4 · Q-DOC-4 · Q-INT-7 · Q-AI-7 · Q-PRIV-1 |
| **Records / Program Advising** | Q-SYS-3 · Q-AUTO-3 · Q-ROLE-5 |
| **TRU Privacy Office / Accessibility Services** | Q-INT-2, 6 · Q-AI-7 · Q-PRIV-1, 2, 3, 4, 6 |

---

## 1. Priority and scope

<a id="q-scope-1"></a>
**Q-SCOPE-1. Phasing.** The email calls *Assessment of CBPs* the "top priority" and *Advisor feedback* the "next priority". Should we deliver them as **sequential phases** (assessment first, coaching second) or in **parallel**? Is there a target date for the first release?
- *Ask:* Director, Manager.
- *Why it matters:* it decides the scope of the first release, and whether we build the student upload flow first or last.
- *Source:* EMAIL. It ranks the projects but gives no phasing or dates. See [11 §1](11-scope-and-ai-analysis.md#1-priority-and-phasing-assessment-interviews-and-coaching).

<a id="q-scope-2"></a>
**Q-SCOPE-2. What AI should do in assessment.** Which level of AI involvement do you want?
- (A) digital tools only
- (B) AI maps evidence to rubric criteria and drafts questions and reports, with assessors deciding
- (C) AI **suggests** I/S/O ratings for assessors to accept or override
- (D) AI decides ratings or awards
- *Ask:* Director, with assessor input.
- *Why it matters:* this is the single biggest design decision. It also has policy and bias implications.
- *Source:* EMAIL asks for "efficiencies using AI/technology" without saying how. P1-B p.3 (ED-2.0), p.33 ("could be machine marked"), p.22–23 (independence). See [11 §2](11-scope-and-ai-analysis.md#2-what-portfolio-assessment-means-and-whether-ai-should-score).

<a id="q-scope-3"></a>
**Q-SCOPE-3. Phase 1 without student uploads.** If assessment comes first, may the assessment tool **import final portfolios** from Moodle or email, while students and advisors keep their current process for now?
- *Ask:* Manager, IT.
- *Why it matters:* it decides whether Phase 1 needs Moodle integration, manual upload by advisors, or a student portal.
- *Source:* P1-B p.19; P2-A step 7.

<a id="q-scope-4"></a>
**Q-SCOPE-4. Success measures.** Which outcomes matter most? For example: assessor effort per portfolio, the time students wait for feedback, the time from interview to result, advisor caseload capacity, consistency between assessor pairs. Do you have baseline figures?
- *Ask:* Director, Manager.
- *Why it matters:* it lets us prioritise features and show the value in the proposal.
- *Source:* none. The sources give effort estimates but no targets.

<a id="q-scope-5"></a>
**Q-SCOPE-5. Context from the earlier meeting.** The email follows "a great meeting last week". Were any requirements agreed there that are not in the email, such as AI interviews, grading, or particular tools? And who sent the email (name and role)?
- *Ask:* the sender of the email, or the Director.
- *Why it matters:* features have been requested of our team (such as AI interviews) that do not appear in the documents.
- *Source:* EMAIL (the sender is unnamed; the meeting is not documented).

## 2. AI-powered multimodal interviews

<a id="q-int-1"></a>
**Q-INT-1. Is an AI interview wanted, and in what form?** Our team was asked to build a multimodal AI that **conducts and records** the student interview and then analyses it. None of the documents mentions this. Which of the following, if any, do you want?
- (I-1) an AI **practice** interview for students
- (I-2) an AI **assistant** during the human-led Discussion of Learning (transcription, competency tracker, notes)
- (I-3) AI asks the questions, and assessors review the recording
- (I-4) a fully AI-conducted and AI-assessed interview
- *Ask:* Director.
- *Why it matters:* this ranges from a small add-on to a fundamental change to the assessment model. It sits in Project #1, step 4.
- *Source:* absent from all sources. P1-B p.23; P2-I p.65–67. See [11 §3](11-scope-and-ai-analysis.md#3-ai-powered-multimodal-interviews).

<a id="q-int-2"></a>
**Q-INT-2. Recording and transcription.** May Discussion of Learning sessions be recorded or transcribed? If so: how is consent obtained, where is the recording stored, how long is it kept, and what happens for students who choose audio only?
- *Ask:* Director, Privacy Office.
- *Why it matters:* it determines whether variants I-2 to I-4 are feasible at all, and what storage and retention are needed.
- *Source:* no source mentions recording. Audio-only option at P2-I p.67; notes retention at P1-B p.26.

<a id="q-int-3"></a>
**Q-INT-3. Interview companion for assessors.** Would assessors use a pre-filled script (names, program plan facts, chosen questions) with note fields for each competency during the interview? Do they currently type notes into the worksheet live?
- *Ask:* Assessors.
- *Why it matters:* it decides the scope of the interview screen.
- *Source:* P1-E; P1-C; P1-B p.23 ("often on one of the three documents").

<a id="q-int-4"></a>
**Q-INT-4. Safeguards for any AI-led interview.** If I-3 or I-4 is wanted, how should these be met?
- checking authenticity
- live probing that does not lead the student
- cultural safety
- the needs of oral communicators
- accommodations
- handling a student in distress

Does policy ED-2.0 allow it? Would the promise to students that they will "be interviewed by a two-person team of PLAR Assessors" change?
- *Ask:* Director.
- *Why it matters:* these are hard constraints on the design.
- *Source:* P1-B p.3, p.23, p.26–27, p.38, p.41; P2-I p.67.

<a id="q-int-5"></a>
**Q-INT-5. Practice interview demand.** Would an AI mock interview be a useful addition to the existing mock Discussion of Learning video?
- *Ask:* Advisors.
- *Why it matters:* it is a low-risk AI feature that could sit in the coaching phase.
- *Source:* P1-J; P2-I p.65.

<a id="q-int-6"></a>
**Q-INT-6. Identity verification before the interview.** We propose that the student shows photo ID to the camera before the Discussion of Learning. The platform captures it, AI helps read and compare it, and **a person (e.g. the advisor who connects the call) confirms the match**. ID images are deleted soon afterwards. Is this wanted? Is automated face matching acceptable, or should the comparison stay a human visual check?
- *Ask:* Director, Privacy Office.
- *Why it matters:* ID images are sensitive and close to biometric data. The answer decides whether we build ID capture, how matching works, and what consent and retention are needed. See [15 §4](15-technical-approach.md#4-identity-verification-technical-design).
- *Source:* today the chair confirms identity verbally (P1-E), and the interview checks authenticity (P1-B p.23, p.41). A photo-ID check is our proposal.

<a id="q-int-7"></a>
**Q-INT-7. Built-in interview room vs Zoom.** We propose conducting and streaming interviews in our **own interview room**, with Zoom as a fallback. Is this acceptable? Does TRU have an institutional Zoom licence we should use for the fallback? Must the **phone/teleconference** option remain?
- *Ask:* Director, IT.
- *Why it matters:* scope and cost of the media infrastructure, and the fallback design.
- *Source:* interviews are held today by Zoom or teleconference, with an audio-only option (P2-I p.67; P1-B p.120). The tools and accounts are not named.

<a id="q-int-8"></a>
**Q-INT-8. Accepted ID and who verifies.** Which documents count as acceptable ID (government photo ID, TRU student card, status card, others)? Who should do the verification (the advisor connecting the call, the chair, other staff)? What happens if a student can't be verified on the day?
- *Ask:* Director, Advisors.
- *Why it matters:* the verification workflow, permissions and fallback path.
- *Source:* not covered.

## 3. End-to-end workflow and systems

<a id="q-flow-1"></a>
**Q-FLOW-1. Confirm the current workflow.** Is the sequence in [05-end-to-end-workflow.md](05-end-to-end-workflow.md) accurate today? Are any steps missing or out of date?
- *Ask:* Advisors, Manager.
- *Why it matters:* it is the baseline for every feature.
- *Source:* compiled from P1-A, P2-A, P1-B and P2-I, which differ in places.

<a id="q-flow-2"></a>
**Q-FLOW-2. Case tracking today.** How do advisors track each student's status (questionnaire, AR, payment, due date, feedback rounds, assessment)? A spreadsheet, the inbox, Outlook, something else?
- *Ask:* Advisors.
- *Why it matters:* data migration, and what the platform's case record must hold.
- *Source:* not documented.

<a id="q-flow-3"></a>
**Q-FLOW-3. Payment.** How is the fee paid and confirmed (which system)? Should the platform show payment status, link to payment, or leave payment out entirely?
- *Ask:* Advisors (and Finance if needed).
- *Why it matters:* integration, and compliance (we will not handle card data).
- *Source:* P2-A step 4; P2-B PDF p.15. The method is not stated.

<a id="q-flow-4"></a>
**Q-FLOW-4. Moodle access and resources.** How is access to the PLAR Moodle site granted, and by whom? If the resources were also in the platform, would students still need Moodle?
- *Ask:* Advisors, IT.
- *Why it matters:* the onboarding design, and whether to integrate with Moodle.
- *Source:* P2-A step 5; P1-B p.11.

<a id="q-flow-5"></a>
**Q-FLOW-5. Current volumes.** Roughly how many people a year take the questionnaire, have an AR reviewed, start a portfolio, are assessed, or appeal? How many advisors and active assessors are there?
- *Ask:* Manager.
- *Why it matters:* scale, hosting, AI cost estimates and licensing.
- *Source:* P1-B p.7 gives only cumulative figures, which are dated.

<a id="q-flow-6"></a>
**Q-FLOW-6. Other PLAR streams.** Should the platform eventually support Course-based Portfolios, Challenge Exams or Credit Bank, or only Competency-based Portfolios?
- *Ask:* Manager, Director.
- *Why it matters:* how general the data model needs to be.
- *Source:* P1-B p.9–10; P2-I p.70.

<a id="q-sys-1"></a>
**Q-SYS-1. Integrations and hosting.** Which TRU systems may we integrate with: single sign-on (which identity provider?), Moodle, Microsoft 365 / Outlook, Zoom, Banner, DegreeWorks? Are there approved-vendor or hosting requirements?
- *Ask:* IT.
- *Why it matters:* architecture and the technology stack.
- *Source:* these systems are named in P1-B p.11, p.120; P2-A step 6; P2-B. No integration expectations are stated.

<a id="q-sys-2"></a>
**Q-SYS-2. Scheduling tools.** Which tool runs the monthly assessor availability poll? Whose Zoom accounts host the interviews? Which calendars are used?
- *Ask:* Advisors / booking coordinator, IT.
- *Why it matters:* the design of a scheduling module.
- *Source:* P1-B p.18, p.120. The tools are not named.

<a id="q-sys-3"></a>
**Q-SYS-3. Credit-entry request format.** In what format and by what channel do advisors ask Records to enter credits? Would a structured export help? Is any Banner integration allowed?
- *Ask:* Records.
- *Why it matters:* the end of the workflow.
- *Source:* P2-A step 15; P1-B p.11.

<a id="q-sys-4"></a>
**Q-SYS-4. Ownership.** Who will host, support and maintain the platform after launch: TRU IT or our team?
- *Ask:* IT, Director.
- *Why it matters:* hosting choices, the security review, and handover documentation.
- *Source:* not stated.

## 4. Readiness questionnaire

<a id="q-quest-1"></a>
**Q-QUEST-1. Current platform.** Which tool hosts the 48-question readiness questionnaire, and who owns it? Can you share the questions, the scoring logic and the result bands?
- *Ask:* Advisors.
- *Why it matters:* we need these whether we integrate the questionnaire or rebuild it.
- *Source:* P2-A step 2 ("online questionnaire"); P1-B p.7–8. The platform is not named.

<a id="q-quest-2"></a>
**Q-QUEST-2. Move it into the platform?** Should the questionnaire live in the new platform (a public link, responses stored, results visible to advisors, linked to the student's case), or stay where it is with only the results brought in?
- *Ask:* Director.
- *Why it matters:* it decides whether we need a public, unauthenticated entry point, and the shape of the intake funnel.
- *Source:* not stated. This is a proposed feature.

<a id="q-quest-3"></a>
**Q-QUEST-3. The auto-response.** The advisors built an automatic response telling students how strong their candidacy is, but it "hasn't yet been activated". Why not? Do you approve activating it, and with what wording for each result band?
- *Ask:* Director, Advisors.
- *Why it matters:* it is a ready-made efficiency gain, but it is a student-facing judgement.
- *Source:* P2-A step 2.

<a id="q-quest-4"></a>
**Q-QUEST-4. Who takes it and how they are identified.** Do only enrolled students (with a T-ID) take the questionnaire, or prospective students too? Should results link automatically to the AR review?
- *Ask:* Advisors.
- *Why it matters:* authentication and data linking.
- *Source:* P1-B p.7 says it is sent after program entry. P2-I p.10.

## 5. Document collection, review and communication

<a id="q-doc-1"></a>
**Q-DOC-1. Replace or supplement?** Should the platform **replace** the current email and Moodle document handling (students upload, advisors comment in the platform, students are emailed when action is needed, assessors review in the platform)? Or should it **supplement** it (keep Moodle and email and integrate selected parts)? Or phase it in?
- *Ask:* Director, Manager, Advisors.
- *Why it matters:* a large share of the build effort, plus change management.
- *Source:* P2-A step 7; P2-I p.62–63. No preference is stated. See [08 §4](08-communications-scheduling-records.md#4-document-collection-review-and-communication).

<a id="q-doc-2"></a>
**Q-DOC-2. The system of record for portfolios.** Where does the authoritative final portfolio live today: the Moodle course, a shared drive, the PLAR inbox? Who moves emailed files there?
- *Ask:* Advisors.
- *Why it matters:* migration, and where assessors get files from.
- *Source:* P2-I p.62; P1-B p.11, p.19.

<a id="q-doc-3"></a>
**Q-DOC-3. Commenting format.** Do advisors need to keep commenting inside Word files, or would commenting in the browser on the uploaded document work? Must students still be able to submit websites, mail or USB?
- *Ask:* Advisors.
- *Why it matters:* the document viewer and annotation design.
- *Source:* P2-I p.62–63; P2-C.

<a id="q-doc-4"></a>
**Q-DOC-4. Notifications and files.** Should notifications go by email only, or also through a portal? What are the largest evidence files (e.g. MP4/WMV video), and are any formats prohibited?
- *Ask:* Advisors, IT.
- *Why it matters:* storage and the notification design.
- *Source:* P2-I p.62 (accepted formats; the 20 MB email limit).

## 6. Standard comments and AI-assisted feedback

<a id="q-fb-1"></a>
**Q-FB-1. AI-ranked comment suggestions.** Would advisors welcome a feature that shows the **~10 most relevant entries** from the Standard Responses library for a selected passage, which the advisor then picks and edits? May the AI read the student's draft to rank them?
- *Ask:* Advisors.
- *Why it matters:* this is the core AI feature for Project #2.
- *Source:* P2-D (279 entries); P2-C (entries reused word for word). See [07 A.6](07-advising-and-feedback.md#a6-the-standard-comments-library-p2-d).

<a id="q-fb-2"></a>
**Q-FB-2. Verbatim or AI-adapted.** Should only library entries be inserted, with placeholders filled in? Or may the AI rephrase or personalise them, and generate new comments in the same style?
- *Ask:* Advisors, Director.
- *Why it matters:* the level of control and the tone risk.
- *Source:* P2-E "Tone of comments".

<a id="q-fb-3"></a>
**Q-FB-3. Automated checklist checks.** Which checklist items would advisors trust the platform to check automatically? Examples: page counts, evidence count, every evidence item has an EDL entry with a "why", references inside the narrative, all 8 competencies present, CL request matches the Program Plan.
- *Ask:* Advisors.
- *Why it matters:* a quick efficiency gain.
- *Source:* P2-E; P2-I p.61.

<a id="q-fb-4"></a>
**Q-FB-4. AI hints for advisors.** Is it acceptable for the AI to highlight, **for the advisor only**, passages that describe experience without learning, or that sit at a lower Bloom's level than the student's petition?
- *Ask:* Advisors, Director.
- *Why it matters:* advisors must guide without assessing (P2-E), and over-coaching is a stated risk (P1-B p.12).
- *Source:* P2-J; P1-H; P2-E.

<a id="q-fb-5"></a>
**Q-FB-5. Draft summary emails.** Would an automatically drafted round-summary email, built from the comments the advisor chose, be useful?
- *Ask:* Advisors.
- *Why it matters:* the advisor feature set.
- *Source:* P2-B.

<a id="q-fb-6"></a>
**Q-FB-6. Content ownership.** Who maintains and approves changes to the Standard Responses (P2-D), the Question Bank (P1-D) and the templates? Are there standard responses for sections other than the DoL?
- *Ask:* Advisors, Manager.
- *Why it matters:* the content-admin role and versioning.
- *Source:* both are described as living documents (P2-D title; P1-D intro).

## 7. Assessment process and AI use

<a id="q-assess-1"></a>
**Q-ASSESS-1. Assessor pain points.** Which assessor steps take the most effort or cause the most friction today?
- *Ask:* Assessors.
- *Why it matters:* it tells us what to build first within Project #1.
- *Source:* P1-A; P1-B p.19–26.

<a id="q-assess-2"></a>
**Q-ASSESS-2. Digital worksheet and independence.** Would assessors use an in-platform rubric worksheet instead of the Word form? Should the platform **hide each assessor's preliminary ratings from the co-assessor until both have submitted**?
- *Ask:* Assessors.
- *Why it matters:* the core screen of Phase 1, and protecting independence.
- *Source:* P1-C; P1-B p.21–23.

<a id="q-assess-3"></a>
**Q-ASSESS-3. Question exchange.** Is the advance question-exchange document used by every pair? Would a shared prep space replace the email exchange?
- *Ask:* Assessors.
- *Why it matters:* the design of the collaboration flow.
- *Source:* P1-B p.21 ("some assessor pairs").

<a id="q-assess-4"></a>
**Q-ASSESS-4. Credit calculation rules.** Is the Assessment Scale (P1-G) binding or guidance? How does it fit with "S in two or three → a minimum of six credits" (P1-B p.24) and the proportion example (P1-B p.35)? How are credits split between lower and upper level, and rounded?
- *Ask:* Director.
- *Why it matters:* any calculator must reflect the real rules and leave room for discretion.
- *Source:* P1-G; P1-B p.24, p.35. See [04 §6](04-competencies-rubric-and-credit.md#6-credit-award-determination).

<a id="q-assess-5"></a>
**Q-ASSESS-5. Report review and templates.** What exactly do the Manager and Director check when they review a report, and could some of it be checked automatically (e.g. that the award matches the narrative and the table)? Are the template (P1-F), the phrase inventory and the sample reports current?
- *Ask:* Director, Manager.
- *Why it matters:* report generation and validation.
- *Source:* P1-B p.26, App. E–F; P1-F.

<a id="q-assess-6"></a>
**Q-ASSESS-6. Assessor accounts and inputs.** Do all assessors have TRU accounts (for single sign-on)? How do they receive the Program Plan and accommodation notices today?
- *Ask:* Assessors, IT.
- *Why it matters:* authentication, and what data the assessment workspace needs.
- *Source:* P1-B p.19, p.41; P2-I p.14. Assessors may be former faculty (P2-I p.71).

<a id="q-ai-1"></a>
**Q-AI-1. TRU AI policy.** Is there TRU policy or guidance on using AI in assessment, and on sending student data to AI services?
- *Ask:* Director.
- *Why it matters:* it gates every AI feature.
- *Source:* not covered in the sources.

<a id="q-ai-2"></a>
**Q-AI-2. When AI output is shown.** If AI evidence-mapping is used, should assessors see it **before** or **after** recording their own preliminary ratings?
- *Ask:* Director, Assessors.
- *Why it matters:* avoiding anchoring and bias.
- *Source:* P1-B p.22–23, p.39–40.

<a id="q-ai-3"></a>
**Q-AI-3. Question generation.** Should AI-suggested interview questions come only from the Question Bank (last updated in 2020), or may the AI generate portfolio-specific questions? Is the bank due for an update?
- *Ask:* Assessors.
- *Why it matters:* the design of question generation.
- *Source:* P1-D; P1-B p.36–37.

<a id="q-ai-4"></a>
**Q-AI-4. AI report drafts.** Would assessors be comfortable with an AI-generated first draft of the report, which the writer edits and the chair reviews?
- *Ask:* Assessors, Director.
- *Why it matters:* it is likely to be one of the largest time savings, but tone and accountability matter.
- *Source:* P1-B p.25–26.

<a id="q-ai-5"></a>
**Q-AI-5. A student-facing AI coach.** Is an AI that prompts students to reflect (without ever writing for them) acceptable under TRU's academic integrity rules?
- *Ask:* Director, Advisors.
- *Why it matters:* it is a possible Project #2 feature with integrity risk.
- *Source:* P2-I p.12; P2-B PDF p.15.

<a id="q-ai-6"></a>
**Q-AI-6. Students' use of generative AI.** What is TRU's or PLAR's position on students using generative AI to write portfolio content? Should the platform flag possible AI-generated text?
- *Ask:* Director.
- *Why it matters:* integrity features, and the guidance students receive.
- *Source:* not covered. The authenticity statement is at P2-B PDF p.15.

<a id="q-ai-7"></a>
**Q-AI-7. Which AI route is acceptable.** We are considering (A) **the Microsoft Copilot ecosystem** (Microsoft 365 Copilot for staff productivity, and Microsoft's developer AI platform for in-platform features), or (B) **a proprietary multimodal model** reached through an enterprise endpoint with data-protection guarantees. Both must meet our **no-training** requirement (no student data, assessment material or recordings used to train the provider's models). Does TRU have Microsoft 365 Copilot licences or an Azure tenant we should use? Are any AI providers already approved, or prohibited?
- *Ask:* Director, IT, Privacy Office.
- *Why it matters:* it narrows the provider evaluation and the contracts needed. See [15 §3](15-technical-approach.md#3-llm-integration-provider-options-and-privacy-requirements).
- *Source:* not covered. TRU's use of Microsoft 365 is implied by Outlook and Teams (P2-A step 6; EMAIL).

## 8. Reminders, scheduling, reports and credit recording

<a id="q-auto-1"></a>
**Q-AUTO-1. Reminder automation details.** We intend to automate the 6, 12, 20 and 24-week reminders. Please confirm:
- the wording of each reminder
- whether the schedule is fixed or configurable
- whether reminders should depend on progress (e.g. skip "send your first competencies" if they have already been sent)
- whether the advisor should be copied
- whether the events must still appear in Outlook
- how extensions and the 2-week revision window should reset the schedule
- *Ask:* Advisors.
- *Why it matters:* the reminder module.
- *Source:* P2-A step 6; P2-I p.7, p.64. See [08 §1](08-communications-scheduling-records.md#1-reminders-and-due-dates).

<a id="q-auto-2"></a>
**Q-AUTO-2. Interview scheduling in the platform.** Should these move into the platform: assessor availability (replacing the monthly poll), slot matching across the four participants, calendar invites linking to the built-in interview room (Zoom links only for the fallback), and Interview Letters 1 and 2? Would assessors enter their availability there?
- *Ask:* Advisors / booking coordinator, Assessors.
- *Why it matters:* the scope of the scheduling module.
- *Source:* P1-B p.18, p.120–121; P2-A step 11.

<a id="q-auto-3"></a>
**Q-AUTO-3. Result release and credit entry.** Should releasing results to the student, and generating the credit-entry request for Records, happen in the platform?
- *Ask:* Manager, Records.
- *Why it matters:* the end-of-workflow features.
- *Source:* P2-A steps 14–15; P2-I p.70.

<a id="q-auto-4"></a>
**Q-AUTO-4. Statistics and reporting.** Which statistics or "PLAR reports" are produced today, for whom, and how often?
- *Ask:* Manager, Director.
- *Why it matters:* the design of a dashboard.
- *Source:* P1-B p.11 ("collecting statistics for various PLAR reports").

## 9. Roles, permissions and terminology

<a id="q-term-1"></a>
**Q-TERM-1. DoL terminology.** Please confirm: "**Demonstration** of Learning" is the written portfolio section, and "**Discussion** of Learning" is the interview. Both are abbreviated "DoL", and older documents use "Discussion" for the section. May the platform use the full names and avoid "DoL"?
- *Ask:* Advisors, Director.
- *Why it matters:* consistent labels in the UI and data model.
- *Source:* P1-B p.13; P2-H p.5; P2-I p.35 versus P2-I, P2-A and EMAIL. See [02 §1](02-terminology.md#1-demonstration-of-learning-vs-discussion-of-learning).

<a id="q-role-1"></a>
**Q-ROLE-1. Approval for assessment.** Who approves a portfolio for assessment: the Manager, the Director, or either? Can the approval be delegated?
- *Ask:* Director, Manager.
- *Why it matters:* the approval permission in RBAC.
- *Source:* P2-A step 10, P2-B PDF p.2 and P2-I p.62 say the Manager. P2-I p.10 and p.64, and P1-B p.120, say the Director. See [09 §3](09-roles-and-permissions.md#3-conflicts).

<a id="q-role-2"></a>
**Q-ROLE-2. Assessor assignment.** Who selects the two assessors, and who confirms the pair? What part do advisors play? Should the selection criteria (expertise, availability, deliberately different thinking styles) be recorded?
- *Ask:* Director, Manager.
- *Why it matters:* the assignment permission and the matching features.
- *Source:* P1-B p.11 ("assigns"), p.19 ("advisors' and director's evaluation"); P2-A step 10 ("recommends").

<a id="q-role-3"></a>
**Q-ROLE-3. Report review and release.** What is the current path: does the advisor log the report, the Manager review it, and the Director decide? Who releases the result to the student, and who can send a report back to the assessors?
- *Ask:* Director, Manager.
- *Why it matters:* workflow states and permissions.
- *Source:* P1-A step 7; P2-A steps 12–14; P1-B p.11, p.26; P1-E; P1-F; P2-I p.67.

<a id="q-role-4"></a>
**Q-ROLE-4. Chair and writer.** Who designates the chair and the writer: the assessors themselves at the pre-meeting, or the Manager or Director when assigning?
- *Ask:* Assessors.
- *Why it matters:* whether the role is set at assignment or chosen later.
- *Source:* P1-A step 3; P1-B p.19.

<a id="q-role-5"></a>
**Q-ROLE-5. Other users.** Should Program Advisors, Records, administrative or CUPE staff, or senior leadership have any access, such as read-only? Who manages user accounts?
- *Ask:* Director, Records.
- *Why it matters:* the full list of roles.
- *Source:* P1-B p.11 (admin support roles).

## 10. Privacy, security and compliance

<a id="q-priv-1"></a>
**Q-PRIV-1. Data residency and approved AI providers.** Must student data stay in Canada? Is a privacy impact assessment required? Which AI providers and hosting regions are approved, if any?
- *Ask:* Privacy Office, IT.
- *Why it matters:* the hosting and AI vendor choices.
- *Source:* P1-B p.44 (confidentiality). BC FIPPA is our assumption, not from the sources.

<a id="q-priv-2"></a>
**Q-PRIV-2. Consent and opt-out.** Will students need to consent to AI processing of their portfolio or interview? Must there be a non-AI alternative?
- *Ask:* Privacy Office, Director.
- *Why it matters:* consent flows and fallback paths.
- *Source:* not covered.

<a id="q-priv-3"></a>
**Q-PRIV-3. Retention.** What retention rules apply in the platform to portfolios, evidence, advisor comments, assessor notes (at least 2 years, then destroyed), reports (the permanent record) and any recordings?
- *Ask:* Director, Records, Privacy Office.
- *Why it matters:* the data lifecycle features.
- *Source:* P1-B p.21, p.25–26.

<a id="q-priv-4"></a>
**Q-PRIV-4. Accessibility standard.** Which accessibility standard must the platform meet (e.g. WCAG 2.1 AA)? What alternatives are required for AI-driven interactions?
- *Ask:* Accessibility Services, IT.
- *Why it matters:* UI requirements and testing.
- *Source:* P1-B p.41; P2-I p.8, p.67.

<a id="q-priv-5"></a>
**Q-PRIV-5. Data for building and evaluating AI.** May we use the shared sample portfolio for development and testing? Can you provide more anonymised portfolios, with their rubric worksheets and reports, so we can measure the AI against assessors' judgements?
- *Ask:* Director, Privacy Office.
- *Why it matters:* without examples, AI quality cannot be validated.
- *Source:* EMAIL (shared "with some information redacted" and with permission).

<a id="q-priv-6"></a>
**Q-PRIV-6. Handling of ID images and recordings.** If identity verification and recording are approved: what retention period applies to ID images (we propose deleting them right after the interview) and to recordings? Is a privacy impact assessment required? Who may access each?
- *Ask:* Privacy Office, Director.
- *Why it matters:* storage design, deletion jobs and access controls for the most sensitive data in the platform.
- *Source:* not covered. Notes retention (2 years) is at P1-B p.26.

## 11. Project logistics

<a id="q-log-1"></a>
**Q-LOG-1. Contacts and sign-off.** Who is our day-to-day contact, and who signs off on requirements and the proposal?
- *Ask:* Director.
- *Why it matters:* governance.
- *Source:* EMAIL (the sender is unnamed).

<a id="q-log-2"></a>
**Q-LOG-2. The proposal and the leadership report.** What format and level of detail do you expect in our proposal, and by when? Did the report to Gord and Liesel (due "September 11th") include anything that affects our scope or timeline?
- *Ask:* Director.
- *Why it matters:* planning and alignment.
- *Source:* EMAIL.

<a id="q-log-3"></a>
**Q-LOG-3. Budget for running costs.** Are there budget limits on ongoing costs, such as AI usage, hosting or video processing?
- *Ask:* Director.
- *Why it matters:* model and architecture choices.
- *Source:* not covered.

## 12. Design and branding

<a id="q-ds-1"></a>
**Q-DS-1. TRU brand guidelines.** We propose a clean, modern design system with teal accents for the platform and its documents ([14-design-system.md](14-design-system.md)). Do TRU's brand guidelines (logo, colours, typefaces) apply to the platform, to student-facing documents such as assessment reports and letters, or to both? Who approves the visual design?
- *Ask:* Director (and TRU Marketing/Communications if needed).
- *Why it matters:* the colours, fonts and logo use in the app and in official documents.
- *Source:* not covered. The existing documents use TRU-OL branding (P2-H; P2-I).
