# Technical Approach: Architecture, Interviews, LLM Integration and Privacy

The technical companion to [13-features.md](13-features.md). It covers how the platform would be built, the options for the interview platform and for AI, and the **mandatory privacy requirements** any AI service must meet.

[← Back to index](index.md)

> **Status:** draft v0.2, 2026-10-22. **No LLM provider has been chosen** (project-lead decision, 2026-10-22). Every AI option below must pass the requirements in §3.3 and the evaluation in §3.4 before it is selected.

---

## 1. Architecture at a glance

```
 Browser (students, advisors, assessors, Manager/Director)
   │  Next.js web app (TypeScript) — design system in 14-design-system.md
   ▼
 Application server (Next.js server, containerised, Canadian region)
   ├── Case & workflow services ── PostgreSQL (+ vector search for comment library)
   ├── Documents ──────────────── Object storage (Canada), signed URLs, virus scan, DOCX→PDF
   ├── Jobs & reminders ───────── Postgres-backed job queue (reminders, AI batches, emails)
   ├── Email ──────────────────── Microsoft Graph (PLAR@tru.ca) or transactional email (Canada)
   ├── Interview service ──────── WebRTC media server (Canada) + recording + captions  [§2]
   ├── Identity verification ──── capture, OCR/AI assist, short-lived storage         [§4]
   └── AI gateway ─────────────── one internal interface → provider adapter(s)       [§3]
           (redaction, prompt versioning, audit logging, per-feature on/off switches)
```

| Layer | Proposed choice | Notes |
|---|---|---|
| Web app | **Next.js (App Router) + TypeScript** | The project lead's choice |
| UI | Tailwind CSS + accessible headless components, themed from the design tokens | [14-design-system.md](14-design-system.md) |
| Database | PostgreSQL + Prisma; pgvector for semantic search of the standard-comment library | Portable, so it can run on any Canadian host |
| Hosting | A container in a Canadian cloud region. Either TRU's preferred cloud (likely Microsoft Azure, given TRU's Microsoft 365 use) or a managed Postgres, storage and auth platform with a Canada region | Q-SYS-1, Q-SYS-4, Q-PRIV-1 |
| Auth | TRU single sign-on (Microsoft Entra ID) for staff and assessors; secure email sign-in or TRU sign-in for students | Q-ASSESS-6 |
| Documents and PDFs | Object storage with encryption. Chromium-based HTML→PDF using the shared print stylesheet | The design system, §11 |
| Jobs | A Postgres-backed queue: reminders (6/12/20/24 weeks), AI batch jobs, email sending | No extra data store outside the region |
| Observability | Error monitoring and tracing **without sensitive content in logs** | §3.3 R6 |

## 2. Interview platform: our own room (preferred), with Zoom as a fallback

### 2.1 Preferred: a built-in interview room

The Discussion of Learning runs **inside the platform**: a secure video and audio room that students join from their case page.

| Component | Approach |
|---|---|
| Real-time media | **WebRTC** in the browser. Nothing to install. Works on desktop and mobile. |
| Media server | A **self-hosted, open-source WebRTC media server (SFU)** in a Canadian region, or a managed real-time video service with a Canadian region and acceptable terms. Shortlist to be evaluated. |
| Connectivity | TURN relay servers for restrictive networks. Automatic quality adjustment. **Audio-only mode**, which students can already choose today ([P2-I p.67](00-sources.md)). |
| Phone option | A **telephone dial-in** bridge (a SIP gateway), so the existing teleconference option survives ([P1-B p.120](00-sources.md); [P2-I p.67](00-sources.md)) |
| Roles in the room | The advisor admits the student and introduces everyone, then leaves, as today ([P2-I p.67](00-sources.md)). The chair and writer get the interview companion panel. The student sees a simple, calm view. |
| Recording ◆ | Only with consent, and only if the department approves. Recordings are encrypted, have restricted access, and follow a retention schedule (Q-INT-2, Q-PRIV-3). |
| Captions and transcript ◆ | Real-time speech-to-text, subject to the same no-training and residency rules (§3.3) |
| Integration | The room links to the case record, the identity verification step (§4), the interview companion and notes, and to post-interview AI summaries (if approved) |

**Why this is our preferred option**
- Full control of the student experience (calm design, identity check, accessibility).
- The interview connects to notes, rubric, transcript and record without copying anything across.
- Data stays within our chosen region and contracts.

**Feasibility risks, and how we'd handle them**
- **Reliability during live, high-stakes interviews.** Load testing, a pre-call device check, automatic reconnection, and on-call support during interview blocks.
- **Running cost of media infrastructure.** Interview volume is modest (about 300+ candidates since 2015, per [P1-B p.7](00-sources.md)), so a small cluster suffices (Q-FLOW-5).
- **Network and browser variety.** TURN relays, audio-only mode and the phone dial-in.

### 2.2 Fallback: Zoom

If the built-in room isn't ready, or a particular interview needs it, the platform creates a **Zoom meeting automatically** (via the Zoom API), shows the link on the case page and in the invitation, and still records the interview's outcome and notes in the platform.

| Trade-off | Built-in room | Zoom fallback |
|---|---|---|
| Student experience and design | Fully ours | Zoom's |
| Identity check before joining | Built in | A separate step in the platform before the Zoom link is released |
| Captions, transcript, AI summary | Integrated | Through Zoom's own features and terms, imported afterwards |
| Data location and terms | Our chosen region and contracts | Zoom's terms (TRU may already have an institutional licence, Q-INT-7) |
| Time to launch | Longer | Quick |

The department's current interview tools (Zoom or teleconference) and accounts are not named in the sources ([08 §2](08-communications-scheduling-records.md#2-interview-scheduling)).

## 3. LLM integration: provider options and privacy requirements

### 3.1 Option A: the Microsoft Copilot ecosystem

TRU already runs on Microsoft 365: Outlook and Teams appear throughout the sources ([P2-A step 6](00-sources.md); [EMAIL](00-sources.md)). That makes Microsoft's AI stack a natural option.

| Part | Where it fits | Notes |
|---|---|---|
| **Microsoft 365 Copilot / Copilot Chat** (under Enterprise Data Protection) | Staff productivity *outside* the platform, such as drafting emails in Outlook or summarising in Word | Microsoft states that with enterprise data protection, prompts, responses and data accessed through Microsoft Graph "aren't used to train foundation models" ([Microsoft Learn: Enterprise data protection](https://learn.microsoft.com/en-us/copilot/microsoft-365/enterprise-data-protection); [EDP FAQ](https://learn.microsoft.com/copilot/edpfaq)). This applies to enterprise sign-in only, not consumer Copilot. Needs per-user licences. |
| **Copilot Studio agents** | Low-code assistants connected to department content | Its fit for embedding inside our web app is to be assessed |
| **Microsoft's developer AI platform (Azure AI Foundry / Azure OpenAI)** | Features *inside* the platform: evidence mapping, question and report drafts, comment ranking, possibly media analysis | Microsoft's documentation says prompts and completions are **not used to train foundation models**, and that for standard (non-Global) deployments they are processed in the chosen geography ([Microsoft Learn: Data privacy](https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/openai/data-privacy)). To check: **abuse-monitoring retention**, and whether an exemption can be granted; which models are available in a **Canadian region**; and that third-party models sold through the same platform may carry different retention terms. |

- **Strengths:** sits inside TRU's existing tenant, identity and contracts. Familiar to staff.
- **To confirm:** licensing, Canadian-region model availability, video and audio capabilities, and abuse-monitoring settings (Q-AI-7).

### 3.2 Option B: a proprietary multimodal model behind a protected endpoint

A model from a proprietary AI provider that natively understands **text, documents, images, audio and video**. That covers portfolio analysis, ID image assistance and interview analysis. We would reach it through an **enterprise endpoint**: the provider's enterprise API, or the provider's model hosted on a major cloud platform, with contractual data protections.

- **Strengths:** the strongest multimodal capability (including video analysis), and a choice of providers.
- **To confirm:** enterprise terms, retention, regional processing, and cost for video-heavy workloads.
- **The shortlist** will come from major providers that offer enterprise-grade endpoints. **No preference is implied until the evaluation in §3.4 is complete.**

A **combination** is possible, for example Copilot for staff productivity plus Option B for in-platform features. All AI calls go through **one internal AI gateway** with swappable adapters, so we can change provider without rewriting features.

### 3.3 Mandatory requirements for any AI service

These are **non-negotiable**. A service that fails any **MUST** is excluded. The platform will handle **sensitive student information, assessment materials, ID images and potentially recorded interviews**.

| # | Requirement | Level |
|---|---|---|
| **R1** | **No training on our data.** The provider's terms (the agreement or DPA, not just marketing pages) must state that our inputs and outputs, including files, images, audio and video, are **not used to train, retrain or improve the provider's models** (or third parties' models). Any opt-outs must be configured. **Consumer or free tiers are never used.** | **MUST** |
| R2 | **Minimal retention.** Zero data retention where available. Otherwise the shortest possible window, with any abuse-monitoring retention understood, minimised, and exempted where the provider allows. No human review of our content by the provider without agreement. | **MUST** |
| R3 | **Known processing and storage location.** Documented for each data type. **Canada preferred**; any processing outside Canada needs TRU Privacy Office approval (Q-PRIV-1). | **MUST** |
| R4 | **Enterprise agreement** with a data processing addendum: subprocessors listed, breach notification, deletion on request and at contract end, suitable for a BC public body. | **MUST** |
| R5 | **Security assurances**: independent audits (e.g. SOC 2 Type II / ISO 27001), encryption in transit and at rest, private networking where available. | **MUST** |
| R6 | **Our own safeguards**: secrets kept in a vault; least-privilege keys for each feature; **no student content in application logs**; redaction of identifiers (names, T-IDs, ID numbers) before sending where the task allows; a prompt and version audit trail. | **MUST** |
| R7 | **Control**: every AI feature can be switched off by the department, and the provider can be replaced through the gateway. | **MUST** |
| R8 | **Functional fit**: long documents (whole portfolios), PDFs and images; structured output; answers grounded in the source with citations; audio and video understanding (for the interview features); acceptable latency for real-time use; strong English support, and other languages if the department needs them; predictable cost. | SHOULD (rated) |
| R9 | **Fairness**: evaluated for bias, e.g. against non-native English writers or oral and story-based answers ([10 §4–5](10-principles-and-constraints.md)). | **MUST** before go-live |

### 3.4 How we will choose

1. **Shortlist** 3–4 options across A and B.
2. **Terms review** against R1–R5, with the TRU Privacy Office and IT security.
3. **Technical spike** on **synthetic or properly anonymised data only.** Real student data never goes to an unapproved service.
4. **Quality evaluation.** Compare the AI evidence maps, questions and report drafts with assessors' actual judgements on anonymised past cases (Q-PRIV-5). Measure accuracy, citation correctness, tone and bias.
5. **Decision record.** The choice, the reasons, the configuration (retention, region, opt-outs) and the review date go in [project-context.md](project-context.md).

Until then, development uses the AI gateway with a **mock adapter** and synthetic portfolios.

### 3.5 How AI is used in the platform (provider-neutral)

| Use | Pattern | Human control |
|---|---|---|
| Evidence map | Portfolio documents → structured output: competency → criterion → claim → **citation to the page and passage** → flags | Assessors review it. Never a score. Possibly shown only after the preliminary rating (Q-AI-2). |
| Question suggestions | Rubric gaps plus question bank plus portfolio context → candidate questions | Assessors choose and edit |
| Report draft | Consensus ratings, notes, phrase library and tone rules → draft, then automatic tone and consistency checks | The writer edits; the chair reviews |
| Comment suggestions | **Search first** (vector plus filters over the 279 standard responses), then a light reranking step → top 10 | The advisor picks and edits |
| Checklist checks | Mostly deterministic code; AI only for fuzzy checks (e.g. whether an EDL caption has a "why") | The advisor confirms |
| Interview summary ◆ | Transcript → a draft summary for each competency | Assessors verify |
| Practice interview ◆ | A conversational agent, with speech-to-text and text-to-speech | Never assessed |
| ID assist ◆ | See §4 | The advisor decides |

**Safety measures:**
- Portfolio and transcript text is treated as **untrusted data**. Instructions embedded in it are ignored. Outputs are validated against their schemas.
- AI never sends anything to students directly.

## 4. Identity verification: technical design

| Step | Design | Privacy control |
|---|---|---|
| Consent | Plain-language notice: what is captured, the purpose (confirming identity for the Discussion of Learning), retention, and alternatives | Recorded consent; an alternative path is offered |
| Capture | Browser camera with a guide frame; **checks run in the browser** for blur, glare and framing; automatic capture when clear | Nothing is saved until the capture is accepted |
| Upload | Encrypted upload to a **dedicated short-lived storage area** (separate bucket, per-object expiry) | Strict access policy; no use outside verification |
| Read and assist | Pull out the name and expiry date (**on-premise or self-hosted OCR preferred**, so ID images need not reach a third-party AI). Compare the name with the case record. Optionally a multimodal model checks the document type, legibility and visible signs of tampering, but only under R1–R6. | ID number is masked; only the needed fields are extracted |
| Face check | **Default: human visual comparison.** The advisor sees the ID photo next to the live capture. **General-purpose LLMs are not reliable for biometric matching.** If the department wants automated face matching, it would need a dedicated, certified face-verification service with liveness detection, and a privacy impact assessment (Q-INT-6, Q-PRIV-6). | No biometric templates are stored |
| Decision | The advisor marks Verified, Needs manual check, or Could not verify. A mismatch is **never an automatic failure**. Fallback: a live manual check, or another method the department approves. | Reasons recorded |
| Retention | ID and face images are **deleted automatically** after the interview, or within an agreed short window. Only the verification record is kept (who, when, method, outcome). | Deletion is logged |
| Access | The verifier role only, time-limited to the verification step. Every view is logged. Assessors see "Identity verified ✓", not the images. | Least privilege |

This builds on today's practice: the chair confirms the student's identity in the script ([P1-E "Chair's Review of Program Plan"](00-sources.md)), and part of the interview's purpose is to confirm authenticity ([P1-B p.23, p.41](00-sources.md)).

## 5. What stays the same regardless of provider

- The design system, the workflow engine, the RBAC model, the audit trail and the document pipeline.
- The principles in [10-principles-and-constraints.md](10-principles-and-constraints.md): people decide, assessors rate independently, cultural safety, academic integrity and accessibility.
