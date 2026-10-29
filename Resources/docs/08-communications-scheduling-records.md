# Communications, Scheduling, Documents and Records

The operational processes that sit around the core advising and assessment work. Each section separates **Existing (documented)** from **Proposed**.

[← Back to index](index.md)

## 1. Reminders and due dates

### Existing (documented)

| Item | Detail | Source |
|---|---|---|
| Who and where | The PLAR Advisor sets the **24-week due date and the reminders**, sends the **intro email**, then sends **four reminders** while the portfolio is being written. All of it is done in the **Outlook calendar**. | P2-A step 6 |
| When | The students' handbook calls them "standard **6-week, 12-week, 20-week and 24-week/due date** reminders". | P2-I p.7 |
| Start of the clock | 24 weeks "from the time your PLAR fee payment is processed and the PLAR Advisors have set your due date". | P2-I p.64 |
| Due date told to the student | In the Moodle-access / welcome email ("you will need to submit it by August ..."). | P2-B PDF p.16 |
| Changes to the due date | One **paid 18-week extension**, requested on an Extension Request Form with a timeline for each section; a free medical extension with documentation; **2 extra weeks** for revisions after the final draft. | P2-I p.7, p.64 |
| Mid-point milestone | Students are urged to send 1–2 competencies by **week 12**. | P2-I p.6–7, p.18; P2-B PDF p.15 |
| Content of the reminder emails | **Not documented.** | — |

### Proposed: automated reminders (project-team decision; stakeholders to confirm details)

The project team **intends** to automate this (project lead, 2026-10-22). The design would:

- Calculate the due date and the **6 / 12 / 20 / 24-week** reminders from the date the fee is processed.
- Recalculate everything when an extension or the post-final 2-week window is granted.
- Use editable reminder templates, which could vary by milestone (e.g. "send your first 1–2 competencies" at week 12).
- Give advisors a view of what is scheduled, with the option to pause or skip.
- Keep a sent log, and send by email.

**Stakeholders need to confirm:** the reminder wording, whether the student or advisor should be copied, whether nudges should depend on progress (e.g. skip "send your competencies" if they have already been sent), and whether Outlook must still show the events. See [Q-AUTO-1](stakeholder-questions.md#q-auto-1).

## 2. Interview scheduling

### What "four calendar events" actually refers to

The sources describe two separate things, which the project lead's note runs together:

1. **Four reminders** to the student while the portfolio is being written (§1 above) [P2-A step 6].
2. **Four people's schedules** that must line up for the interview: **two assessors, the student, and a PLAR Advisor**, who connects the call but does not stay [P1-B p.120 "Interview Letter 1"; P2-I p.67].

### Existing (documented)

| Step | Detail | Source |
|---|---|---|
| Assessor availability | Each month the PLAR office runs an **online poll**, and assessors update it when their availability changes. Interviews are held in blocks on weekdays during business hours. | P1-B p.18 |
| Assessor selection | Based on availability and expertise (see [09](09-roles-and-permissions.md)). | P1-B p.19 |
| Asking the student | **Interview Letter 1** asks for the student's general availability over the coming weeks. A booking coordinator (an advisor) is cc'd and the student replies to all. The coordinator then emails a tentative date and time. Mornings to early afternoons work best. Time zones are taken into account. | P1-B p.120 |
| Timeframe | The interview is "typically set within 3 weeks" of the portfolio being approved, but the team works around the student's schedule. | P2-I p.67 |
| Rebooking | A **cancellation fee** may apply, except for documented medical emergencies. | P1-B p.120; P2-I p.67 |
| Day before | **Interview Letter 2**: a check-in and an explanation of how the call will be connected. | P1-B p.121 |
| On the day | The advisor calls the student, connects the assessors, introduces everyone and leaves; they reconnect if the call drops. By Zoom (video or audio only) or teleconference. | P2-I p.67; P1-B p.121 |
| Tools | The poll tool, calendar and Zoom accounts are **not named**. | — |

### Proposed (to confirm)

- Assessor availability captured in the platform, replacing the monthly poll.
- Suggested matching slots once assessors are assigned, plus a student availability form.
- Calendar invitations (.ics or Outlook) that link to the **built-in interview room** on the student's case page (team preference). A Zoom meeting link is generated only when the Zoom fallback is used ([15 §2](15-technical-approach.md#2-interview-platform-our-own-room-preferred-with-zoom-as-a-fallback); Q-INT-7).
- An identity verification step before the student enters the room ([15 §4](15-technical-approach.md#4-identity-verification-technical-design); Q-INT-6).
- Automatic sending of Letters 1 and 2.
- A rebooking flow that records any cancellation fee.

See [Q-AUTO-2](stakeholder-questions.md#q-auto-2) and [Q-SYS-2](stakeholder-questions.md#q-sys-2).

## 3. Report routing and credit recording

### Existing (documented, with conflicts)

| Step | Detail | Source |
|---|---|---|
| Report submitted | The assessors email it to **PLAR@tru.ca**, mentioning any potential for other PLAR streams. | P1-B p.26, p.39 |
| Received and logged | A PLAR Advisor receives, reviews and **logs** it. | P1-B p.26 |
| Reviewed | By the **Manager** [P1-A step 7; P2-A steps 12–13; P1-F] and/or the **Director** [P1-B p.26]. The reviewer checks content, completeness, **congruence** and transparency. | as cited |
| Sent to the student | By the **Manager** [P2-A step 14] or the **Director** [P1-B p.11, p.26; P2-I p.10, p.67], by email. | as cited |
| Credit entry requested | The **advisor requests credit entry from Records** [P2-A step 15; P2-I p.70]. | as cited |
| Credit entered | In **Banner**, possibly by administrative or CUPE staff [P1-B p.11]. | P1-B p.11 |
| Program Plan updated | Program Advisors email the student an updated Program Plan. The credits appear on the transcript with an "S" grade. | P2-I p.13, p.67, p.70; P2-H p.2 |
| Statistics | Administrative staff collect statistics "for various PLAR reports". | P1-B p.11 |
| Not documented | The format of the credit-entry request; which statistics are reported and to whom; whether a case tracker exists. | — |

The "reports" mentioned in the project lead's note are therefore (a) the **assessment report** (described in [06](06-assessment-workflow.md#step-6-writing-the-initial-report-writer)) and (b) the **statistical reports**, whose content is unknown.

### Proposed (to confirm)

- A **case status pipeline** visible to each role.
- Notification to the student when the result is released.
- A **structured credit-entry request** (student, T-ID, program, LL/UL APST credits, report link) generated for Records. This would be an export or email, not a Banner integration, unless they ask for one.
- A **statistics dashboard** (volumes, cycle times, award distributions).

See [Q-AUTO-3](stakeholder-questions.md#q-auto-3), [Q-AUTO-4](stakeholder-questions.md#q-auto-4) and [Q-SYS-3](stakeholder-questions.md#q-sys-3).

## 4. Document collection, review and communication

### Existing (documented)

| Aspect | Detail | Source |
|---|---|---|
| Student → advisor drafts | Mostly **email attachments** to PLAR@tru.ca, as Word files so advisors can comment in them. | P2-B (whole thread); P2-I p.62 |
| Final submission channels | Email, website, mail/USB, or **Moodle** (described as a newer option). | P2-I p.62–63 |
| Advisor handling | Files are **downloaded from Moodle and uploaded again** after review. Advisors put evidence into an "Evidence" folder and convert Word files to PDF before the files go to assessors. | P2-A step 7; P2-I p.62; P2-B PDF p.16 |
| Assessor access | They **download the portfolio from Moodle** and also get the Program Plan. | P1-B p.19; P1-A step 2; P2-I p.14 |
| Admin support | Staff may download and upload student files and give Moodle access. | P1-B p.11 |
| Feedback channel | Word margin comments plus email (see [07](07-advising-and-feedback.md#a4-the-form-feedback-takes)). | P2-C; P2-B |
| Sharing with our team | The stakeholders used a **Teams folder**. | EMAIL |
| Stakeholder wishes | **Nothing in the sources says whether they want this replaced or kept.** The only signal is the remark "needs to be downloaded from Moodle and then uploaded again", which reads like a pain point. | P2-A step 7 |

### Options to put to the stakeholders

| Option | Description | Implication |
|---|---|---|
| **Replace** | Students upload sections and evidence to the platform. Advisors comment in the platform. Students are emailed when action is needed. Assessors review in the platform. | Biggest efficiency gain. Needs in-browser review and commenting on Word and PDF files, file storage, retention, and a change in student habits. |
| **Supplement** | Keep Moodle and email for documents; the platform links to them or imports them for tracking, AI assistance and assessment. | Lower disruption, but documents are duplicated and there is a sync burden. |
| **Hybrid / phased** | The platform handles assessment first (Project #1), importing the final portfolio; student uploads and advising move in later (Project #2). | Fits the stated priority order. |

See [Q-DOC-1 … Q-DOC-4](stakeholder-questions.md#5-document-collection-review-and-communication).

## 5. Inventory of standard communications

These are candidates for templates. Each exists today as a manual email.

| Communication | From → To | Source |
|---|---|---|
| PLAR introduction (when there is credit room) | Advisor → student | P1-B p.7 |
| Questionnaire result or recommendation | Advisor → student | P1-B p.7–8; P2-A step 2 |
| AR review result | Advisor → student | P2-A step 3; P2-I p.10 |
| Payment information | Advisor → student | P2-A step 4 |
| Registration request | Advisor → Records | P2-A step 4 |
| Moodle access / welcome email (authenticity form, handbook, rubric, scale, due date) | Advisor → student | P2-B PDF p.15–16 |
| Reminders at 6, 12, 20 and 24 weeks | Advisor → student | P2-I p.7 |
| Feedback summaries for each round | Advisor → student | P2-B |
| Final "ready" confirmation and request for Manager approval | Advisor → student / Manager | P2-B PDF p.2 |
| Request to assess | Advisor → assessors | P1-A step 1 |
| Interview Letter 1 (availability) and Letter 2 (day before) | Advisor → student | P1-B p.120–121 |
| Report submission | Assessors → PLAR@tru.ca | P1-B p.26 |
| Results and report | Manager/Director → student | P2-A step 14; P2-I p.67 |
| Credit-entry request | Advisor → Records | P2-A step 15 |
| Updated Program Plan | Program Advisors → student | P2-I p.70 |
