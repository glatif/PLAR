# Project Overview

[← Back to index](index.md)

## 1. The client

- **Who:** The Prior Learning Assessment & Recognition (PLAR) department at **Thompson Rivers University – Open Learning (TRU-OL)**, Kamloops, BC [P2-H p.1 "A Message from the Director, PLAR"; P2-I p.1 "Welcome!"].
- **Named people:**
  - **Susan Forseille** is the PLAR Director [P2-H p.1; P2-I p.1] and a lead author of the Assessor Handbook [P1-B title page].
  - The email is co-written by "Susan and I". "Susan" is cc'd and was on holiday when it was sent [EMAIL]. The sender's name and role are not given.
  - The stakeholders are preparing a report for **"Gord and Liesel"** [EMAIL]. Their roles are not stated; we assume they are senior leadership.
- **Mandate:** PLAR at TRU follows TRU policy **ED-2.0**. Assessing prior learning and setting the credit award "will be done by instructional or faculty staff who have the appropriate subject matter expertise", while "other staff ... may have a supporting role" [P1-B p.3 "Philosophy of PLAR"].
- **Standards followed:** CAPLA (Canadian Association for Prior Learning Assessment) and CAEL (USA Council for Adult and Experiential Learning) quality standards [P1-B p.4, p.6].
- **History and scale:**
  - TRU-OL has offered PLAR since 2007 [P1-B p.7].
  - "Since 2015, PLAR has awarded over 6500 credits in competency-based assessments to over 300 candidates" [P1-B p.7 "An Introduction to Competency-based PLAR at TRU"]. These figures date from the handbook (c. 2020–2022); current volumes are unknown.
  - TRU's research shows PLAR students have higher completion rates and GPAs [P1-B p.7].

## 2. What a Competency-based Portfolio (CBP) is

- One of **four PLAR types** at TRU:
  1. Credit Bank
  2. **Competency-based PLAR**
  3. Course-based PLAR
  4. Challenge Exam

  [P1-B p.9–10 "Different Types of PLAR"; P2-H p.2]
- Competency-based PLAR is **not available to on-campus students** [P1-B p.10].
- A student petitions for a **block of elective credits** by building a portfolio that demonstrates learning from life and work against **eight Critical Competencies**. These reflect the TRU Graduate Attributes [P1-B p.9; P2-H p.2].
- Credits are **Applied Studies (APST)** credits:
  - Recorded with an "S" grade, with no effect on GPA [P2-I p.13 "What type of credit is earned..."].
  - Can only fill **unspecified electives** [P2-I p.3 "Introduction"].
- The maximum award equals the APST room in the student's **Program Plan**, so a full award can be 6 credits for one student and 30 for another [P1-B p.35 "Final Credit Award Determination"].
- **Golden rule:** "credit for learning, not experience" [P1-B p.42; P2-I p.5].
- **Fee:** a $750 flat, non-refundable fee for the Competency-based Portfolio, paid before portfolio work begins [P2-I p.11 "Fees"; P2-A step 4]. A paid extension and an interview rebooking can carry extra fees [P2-I p.64, p.67].
- **Time limit:** 24 weeks to finish the portfolio. One paid extension or a medical extension is possible [P2-I p.10, p.64 "Requesting an Extension"].
- PLAR credits **may not transfer** to other institutions [P2-I p.8 "Before You Begin"].

For details see [03-portfolio-structure.md](03-portfolio-structure.md) and [04-competencies-rubric-and-credit.md](04-competencies-rubric-and-credit.md).

## 3. What the stakeholders asked for

The full email is at [EMAIL]. In summary:

| # | Project title (verbatim) | Priority (verbatim) | What the email covers |
|---|---|---|---|
| 1 | "Assessment of Competency-based Portfolios (CBP)" | "our top priority" | Assessor steps from request to report and credit recommendation, including the **Discussion of Learning interview** (question bank, interview script, mock video), the rubric and worksheet, report template, assessment scale, Bloom's, and a sample portfolio with its completed report. |
| 2 | "PLAR Advisor feedback on Competency-based Portfolios" | "our next priority" | Advisor steps "from student payment through to the portfolio being ready for assessment", a sample email thread, sample feedback, standard responses, checklist, and the student resources. |

- The stated purpose is "**PLAR efficiencies using AI/technology**" [EMAIL, paragraph 1].
- The email does **not** say which steps should use AI, what the AI should do, or whether the two projects are sequential phases. See [11-scope-and-ai-analysis.md](11-scope-and-ai-analysis.md).
- **Requested next action:** "Once you've reviewed the material and have an approximate timeline for when you can get your proposal to us, please let us know" [EMAIL, last paragraph].
- Their own report for Gord and Liesel was due on "September 11th" (the year is not stated) [EMAIL].
- They offered further meetings [EMAIL]. The email also mentions an earlier "great meeting last week", which was not documented.

## 4. Project team direction (from our project lead, not from the sources)

These are **our intentions**, recorded so they stay separate from what the stakeholders have said:

- Build a **Next.js web application** with role-based access tiers.
- Use AI for **real-time interviews** (a multimodal LLM that conducts and records a video interview, then analyses it), **question generation** and possibly **grading**.
- **Automate advisor reminders.** The team intends to offer this.
- Use **AI suggestions of standard comments** for advisors.
- Produce **supporting assets**: role-specific user documentation and a video walkthrough.
- *(Added 2026-10-22)* Run and stream interviews in **our own built-in interview room**, with **Zoom as a fallback** ([15 §2](15-technical-approach.md#2-interview-platform-our-own-room-preferred-with-zoom-as-a-fallback)).
- *(Added 2026-10-22)* **Photo-ID verification** before the interview. AI assists and a person confirms ([15 §4](15-technical-approach.md#4-identity-verification-technical-design)).
- *(Added 2026-10-22)* **Do not commit to an LLM provider yet.** Evaluate the Microsoft Copilot ecosystem and proprietary multimodal models behind protected endpoints. Any integration **must guarantee our data is not used to train the provider's models** ([15 §3](15-technical-approach.md#3-llm-integration-provider-options-and-privacy-requirements)).
- *(Added 2026-10-22)* One **design system** for the platform and every document: Apple-inspired, with teal accents ([14-design-system.md](14-design-system.md)).

The plain-language feature list is in [13-features.md](13-features.md).

Whether each of these is wanted is analysed in [11-scope-and-ai-analysis.md](11-scope-and-ai-analysis.md) and [12-automation-opportunities.md](12-automation-opportunities.md), and the open points are raised in [stakeholder-questions.md](stakeholder-questions.md).
