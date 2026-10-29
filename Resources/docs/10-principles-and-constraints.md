# Principles and Constraints

These are the non-negotiables the sources state. Every platform feature, and especially every AI feature, should be checked against them. Each principle ends with a **design implication**, which is our reading of it and not a stakeholder statement.

[← Back to index](index.md)

## 1. Credit for learning, not experience

- "The golden rule of PLAR is 'credit for learning, not experience'" [P1-B p.42; P2-I p.5].
- Two people with the same job can earn very different awards, depending on what they learned and how they reflect on it [P1-B p.27 "The Role of Experiential Learning"].
- Photographs are evidence of an experience, not of learning [P1-B p.45].
- **Design implication:** any AI analysis must look for reflection, principles and application. It must not count roles, years or activities.

## 2. Human, expert judgement decides the award

- TRU policy ED-2.0: assessment and credit decisions "will be done by instructional or faculty staff who have the appropriate subject matter expertise". Other staff only support [P1-B p.3, p.6].
- "If it was as easy as applying a purely quantitative element, it could be machine marked. It is like the difference between a multiple-choice exam and marking an essay" [P1-B p.33].
- The award combines a proportion of competencies, the student's readiness, and **"a discretionary reliance on the expertise of the assessment team"** [P1-B p.35].
- Excellent assessors need a "high tolerance for ambiguity"; there is "no one-size-fits-all" [P1-B p.12].
- The Director makes the final decision [P1-B p.11].
- **Design implication:** AI can support assessors with mapping, drafting and checks. It should not produce the authoritative rating or award, unless the stakeholders explicitly decide otherwise and policy allows it. See [11 §2](11-scope-and-ai-analysis.md#2-what-portfolio-assessment-means-and-whether-ai-should-score).

## 3. Two independent assessors, then consensus

- Each assessor forms preliminary ratings independently. "Initial consensus is not expected", and the honest discussion of differences "leads to enhanced validity of results" [P1-B p.22–23].
- Assessors are sometimes paired precisely because they think differently [P1-B p.19].
- **Design implication:** do not show one assessor's ratings, or a single AI "answer", in a way that anchors both assessors before they have rated independently.

## 4. Bias awareness

- Assessors must recognise conscious and unconscious bias, including the **halo effect** when an assessor shares the student's experiences [P1-B p.39–40].
- Students' beliefs are not assessed, only their reasoning [P1-B p.12, p.39–40; P1-C "Introduction"].
- Weak communication skills can drag down the ratings of other competencies [P1-B p.18, p.41–42].
- **Design implication:** AI tools can bring their own bias (towards fluent English writing, for example, or particular cultural norms). This needs evaluation before any use.

## 5. Cultural safety and Indigenous ways of knowing

- PLAR is "grounded in Indigenous ways of learning", including the First Peoples Principles of Learning: learning that is holistic, experiential and relational [P1-B p.4; P2-I p.4].
- The interview gives students with an **oral** tradition a chance to show their competency. The question bank refers to Sharing and Learning Circles and to collective responsibility [P1-B p.23; P1-D].
- Cultural safety means assessors reflect on power and privilege, and use inclusive language: for example, not assuming pronouns, partners or holidays [P1-B p.26–27, citing the FNHA policy].
- The interview opens with a land acknowledgement [P1-E].
- **Design implication:** this is critical for any AI-conducted or AI-analysed interview. Oral, indirect or story-based answers must not be penalised.

## 6. Student vulnerability and tone

- Students report that the process feels "as though their life is being judged" [P1-B p.23, p.46]. They feel fear and vulnerability [P2-I p.3].
- **In interviews:** acknowledge answers neutrally and affirmingly. Never say "great answer", and never hint at the outcome [P1-B p.37–38].
- **In reports:** positive, objective, with few "you" statements. Students say "you" statements make them defensive [P1-B p.25].
- **In advisor comments:** encouraging and impartial, guiding without assessing, and not overwhelming the student with questions [P2-E].
- **Design implication:** tone rules can be built into AI drafting and checked automatically. Student-facing AI must never give hints about the outcome.

## 7. Advising vs assessing; guiding vs writing

- Advisors guide; they do not assess or predict credits [P2-E; P2-I p.8].
- Advisors give a general note on writing quality but cannot edit [P2-I p.7].
- Assessors must balance guidance against "over-coaching" [P1-B p.12]. They must not put words in the student's mouth [P1-B p.43].
- **Design implication:** a student-facing AI must **prompt** reflection and never write portfolio content. See §8.

## 8. Academic integrity

- Students sign a **Statement of Authenticity and Confidentiality** under TRU's Academic Integrity policy (ED 5-0) [P2-B PDF p.15; P2-I p.12].
- "Your submitted portfolio must be entirely your work"; falsified evidence is not accepted [P2-I p.12].
- Assessors verify claims through web searches, letterhead, signatures and authorship. One purpose of the interview is checking authenticity [P1-B p.23, p.41].
- Advisors verify one current reference letter [P2-E "Evidence"].
- **Design implication:** the platform may be asked to help detect AI-written portfolios. TRU's position on students using AI is **not stated** in the sources ([Q-AI-6](stakeholder-questions.md#q-ai-6)).

## 9. Fairness of process

- No extra evidence is accepted after the interview [P1-B p.42; P2-I p.67].
- Only one Discussion of Learning is allowed [P2-I p.67].
- No double dipping [P1-B p.32].
- There is a formal appeal route [P2-I p.68].
- **Design implication:** the platform should lock evidence once the interview starts and record what the assessors saw.

## 10. Audit trail and records

- The report is "the only permanent record of the assessment, award, and reasons". It must let an independent third party see the rigour and fairness [P1-B p.25].
- The Director checks that the award and the narrative agree [P1-B p.26].
- Assessor notes are kept **for at least two years**, then shredded or permanently deleted. They support appeals [P1-B p.21, p.26].
- **Design implication:** keep a version history, an append-only log of decisions, and a retention timer for notes.

## Confidentiality and privacy

- "Information shared in the portfolio is completely confidential" [P1-B p.44].
- Advisors balance redaction against the validity of evidence [P2-E "Evidence"].
- The sample portfolio was shared "with some information redacted" and with the student's permission [EMAIL].
- **External context (not from the sources; to verify):** TRU is a BC public post-secondary institution, so BC's *Freedom of Information and Protection of Privacy Act* (FIPPA) is likely to govern where data is stored, disclosure, and the use of third-party AI services. A privacy impact assessment may be required. See [Q-PRIV-1 … Q-PRIV-4](stakeholder-questions.md#10-privacy-security-and-compliance).
- **Design implication:** decide data residency, the AI provider's terms (no training on the data), consent, and access logging before any student data reaches an AI model.

## 10a. AI data protection (project requirement)

- **Any LLM or AI service must guarantee that our data is not used to train the provider's models.** This covers student information, portfolios, assessment materials, ID images and interview recordings. The guarantee must be in the applicable terms or agreement, with opt-outs configured; consumer tiers are never used. (Project-lead decision, 2026-10-22.)
- Retention must be minimal, the processing location must be known, and an enterprise agreement and DPA must be in place. The full requirements (R1–R9) are in [15 §3.3](15-technical-approach.md#33-mandatory-requirements-for-any-ai-service).
- **No provider is chosen** until the options have been evaluated against these requirements ([15 §3.4](15-technical-approach.md#34-how-we-will-choose)).

## 10b. Identity documents (proposed feature)

- If photo-ID verification is approved, ID images are the most sensitive data in the platform, close to biometric data. The rules: collect as little as possible; mask ID numbers; store no biometric templates; delete images promptly; restrict access to the verifier and log every view; **a person makes the decision**; and offer an alternative to camera verification ([15 §4](15-technical-approach.md#4-identity-verification-technical-design); Q-INT-6, Q-PRIV-6).
- The purpose is consistent with today's process: assessors look for evidence "that applicants are who they say they are" [P1-B p.41], and the chair confirms the student's identity [P1-E].

## 11. Accessibility

- Accommodations are arranged through Accessibility Services / FSD, and alternative assessment methods may be available [P1-B p.41; P2-I p.8, p.69].
- Students may choose audio-only interviews and can get help with technology access [P2-I p.67].
- ESL and non-verbal or non-written communication must be accommodated [P1-B p.42].
- **Design implication:** the platform must be accessible. Any AI interview must allow an alternative.
