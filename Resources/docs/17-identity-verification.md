# Identity verification (verification lab)

**Status:** working demo, built 2026-11-11. Lab only: `/verify` (the flow) and `/testing` (the identity checks page) run in development, or when `VERIFICATION_LAB=true` is set at build time and runtime. Both are linked from the home page wherever the lab is on. Captures are stored on disk next to the app (`.verification-data/`), not in Supabase.

**Live since 2026-11-13** at https://plar.airl.ca. **Since 2026-11-19 the captures are protected** (project lead's request): they're stored in the private `verification` bucket of PLAR's own Supabase on the OVH server, **encrypted with AES-256-GCM** by the web app before upload (the bucket and its backups only hold ciphertext). The `/testing` list shows only names, dates, the AI's match percentage and decisions; photos, video, ID details, AI reasons and notes stay on the server until a reviewer **unlocks the page with the password** (the demo password for now; `VERIFICATION_VIEW_PASSWORD` changes it) for 30 minutes. Decisions, deleting and re-running need unlocking. The person verifying can see their own captures in the same browser (signed cookie). The page itself is still open to anyone with the link. See [18-hosting-server.md](18-hosting-server.md) A6.

This is the "photo ID check before the interview" from the features list, built as a separate, testable piece before it joins the interview flow (M3). Design decision: AI assists, a person decides (project rule; see [15-technical-approach.md](15-technical-approach.md)).

## 1. The flow

| Step | What the person does | Automatic help | Fallback |
|---|---|---|---|
| Intro | Reads what will happen, consents | — (privacy note to be written; removed 2026-11-11) | — |
| 1. Face photo | Fits their face in the oval, taps the shutter | MediaPipe Face Landmarker: the oval turns green when one face is centred, the right size, looking straight, well lit and steady for 0.6 s | The shutter always works; after 6 s a "Take the photo anyway" link appears. The result is marked **Manual** |
| Review | Checks the photo, then "Use this photo" or "Retake" | Checklist; zoom | — |
| 2. Head movement | Taps "Start recording", moves their head in one slow circle | 36 ticks around the oval turn green as the head points at them; finishes at 88%; recorded as MP4 (or WebM) | Max 25 s, then **Partial** with "Try again" / "Continue anyway". Without face tracking: a 7 s timed recording, **Manual** |
| 3–4. ID front, back | Holds the card in the frame, taps the shutter (always manual) | OpenCV in a Web Worker finds the card ~6×/s (the outline isn't drawn, so nothing flickers over the card); frame and brackets turn green when the card fills it, is flat, sharp, free of glare and steady | Shutter always works: **Manual** when the card wasn't detected |
| Review | Must tick "Everything is clear and the text is readable" before "Save photo" | Checklist; zoom | Retake |
| Background | — | Server straightens each ID photo (corner detection → perspective correction → gentle sharpening). The AI check runs on the original photos once the face and both sides are in | Corners not found: cropped to the on-screen frame, flagged |
| Done | Sees "You're all set" (or "Saving…" / "Some photos didn't save" with retry) | Polls until straightening and uploads finish | — |

Camera problems (permission denied, no camera, camera busy, insecure page, unsupported browser) show a plain-language screen with "Try again" and "Continue without the camera" (the advisor then confirms identity another way).

Mobile: full-screen camera (`100dvh`, safe-area insets, `viewport-fit=cover`), thumb-zone controls, 76 px shutter, front camera mirrored for positioning (photos are never mirrored), back camera for IDs, torch toggle where supported, camera switch when there's more than one, screen kept awake, haptic tick on Android when alignment turns green.

## 2. Success and failure states

**Per step** (`StepOutcome` in `web/src/lib/verification/states.ts`):

| Outcome | Meaning |
|---|---|
| Passed | Captured with the automatic checks passing |
| Manual | Captured without the checks (or they weren't available). Shown as "Captured" and **not flagged** (project lead, 2026-11-19): a manual capture needs no extra check |
| Partial | Head movement recorded but not completed |
| Missing | Not captured |

**ID straightening:** Straightened · Cropped to frame (flag) · Not processed (flag) · Straightening… (in progress).

**Whole attempt** (`SessionStatus`):

| Status | Meaning |
|---|---|
| In progress | Not every step captured |
| Ready for review | Every step Passed and both IDs straightened |
| Ready for review · flagged | Complete, with at least one flag (head movement not completed, ID corners not found or straightening failed). Manual captures don't flag |
| Camera unavailable | Couldn't use a camera; the advisor confirms identity another way |
| Not finished | Left before the end |

**Decision** (`ReviewDecision`, set only by a person in `/testing`): **Verified** · **Not verified** (follow up with the student). Each row has a two-button toggle; pressing the chosen button again, or Undo in the confirmation, takes the decision back. (The data model still allows "Retry requested"; the page no longer offers it.) Automatic checks and the AI never verify anyone: verification succeeds only when a reviewer marks it Verified.

**How corners are found** (`web/src/lib/verification/card-detect.ts`): two finders propose outlines. One traces closed outlines in several edge and threshold maps; the other finds long straight edges near each side of the on-screen frame and pairs them up. Pairing edges copes with fingers over an edge, a corner out of shot, or a card that blends into the background along one side. Every outline must be card-shaped (corners near 90°, ID-1 proportions allowing for tilt, about the frame's size). Each is then scored on how much of each side runs along a real edge in the photo (a strong change in colour across the side, not along it). The best-supported outline wins. When it sits inside an equally well-supported, equally card-shaped outline, the outer one wins: an ID has rectangles printed on it, never one around it. The winner's sides are then fitted to the edge pixels for precise corners. On the server, the outline the live check found at the moment of capture is scored alongside the others.

## 3. AI check (lab)

When the face photo and both ID sides are in, the server sends the face and the **original** ID photos (not the straightened copies, so a straightening mistake can't hide or distort the card) to an AI model through OpenRouter and stores the answer on the session:

- `face_match`: probability (0–100) that the face and the ID portrait are the same person, a verdict (likely same / uncertain / likely different) and reasons.
- `id_front`: document type, issuer, names, date of birth, sex, number, issue and expiry dates, address, other labelled fields.
- `id_back`: summary, labelled fields, machine-readable text (MRZ/barcode text) copied exactly.
- `image_quality` and `concerns` (specimen, screen photo, expired, mismatched details, editing).

Safeguards: requests ask for providers that **don't collect data for training** (`provider.data_collection: "deny"`); images are downscaled (face 1024 px, ID photos 1600 px, since the card fills only part of the shot); the result is labelled "AI suggestion" and is shown to staff only (never a score to students); every result can be rerun. Model and key: `VERIFICATION_AI_MODEL` (default `google/gemini-3.5-flash-lite`) and `OPENROUTER_API_KEY` in `web/.env.local`. Unset the key to turn it off.

**Project-rule note:** the project rules say not to commit to an LLM provider and not to send real data to external services without approval. The project lead approved this provider for the lab on 2026-11-11. It stays behind one module (`web/src/lib/verification/ai-check.ts`) so it can be swapped, and it must be reassessed against the AI requirements before real student data is used.

## 4. Testing

**Automated** (`npm test` in `web/`, 22 tests):
- Card detection on synthetic photos (a corner counts when within 3% of the card's diagonal): 40/40 whole-photo, 40/40 around the on-screen frame (median corner error 0.2%), 27/30 on hard photos (strong tilt, small cards), 24/30 held in a hand with fingers over one or two edges (the misses are mostly a checked background, whose pattern has straight edges everywhere); nothing found on a photo without a card.
- Straightening: ID-1 proportions, 0.95 similarity to the original card; portrait cards stay portrait.
- Real photos (2026-11-11, five handheld shots of a real BC card against walls, bedding and clothing, fingers over the edges): all five outlined correctly. Kept on the developer's computer only; `tests/verification/debug-real.test.ts` renders the detection for any local photo (`DEBUG_IMAGE`, `DEBUG_GUIDE`, `DEBUG_OUT`).
- Glare: a hotspot is flagged, an evenly bright card isn't.
- Face fit, head-movement ring (both directions, wrap-around) and card-frame logic.

**Sample assets:** `npm run assets:verification` writes synthetic SPECIMEN cards to `web/test-assets/id-cards/` (committed) and fetches MediaPipe's public sample portrait plus re-framed copies to `web/test-assets/faces/` (not committed).

**In the browser without a camera:** the "Testing without a camera?" picker was removed from `/verify` on 2026-11-11 at the project lead's request; the flow now always uses the camera. The code that plays a file as a camera (`openTestSource`) and the sample endpoints are still there if it's needed again.

**On a phone:** `npm run dev:phone` in `web/` (needs `mkcert`), then open the printed `https://<this-mac>:3443/verify` on a phone on the same Wi-Fi and accept the certificate warning once.

**Tested by hand so far:** a real BC identity card held up to a Mac webcam (front and back, several grips); the AI face match on its portrait.

**Still to test by hand:** real faces and the head circle on iPhone Safari and Android Chrome; other cards (driver's licence, BC Services Card, passport card) in daylight and lamplight; cards laid flat on a patterned surface; Windows webcams.

## 5. Files

| Path | What |
|---|---|
| `web/src/app/verify`, `web/src/components/verification/` | The flow and its screens |
| `web/src/app/testing`, `testing-gallery.tsx`, `ai-check-panel.tsx` | "Identity checks" page: search by name, filter by decision (to review, verified, not verified), sort (newest, oldest, name, highest match). One collapsible row per student: face photo, name, date and time, device, AI match percentage, a "to check" count, and the Verified / Not verified toggle. Opening a row shows the captures, the flags and what the AI read from the ID. Delete per row or in bulk |
| `web/src/app/api/verification/` | Sessions, uploads, files (with Range), delete, reprocess, AI check, samples, straightener |
| `web/src/lib/verification/` | Config, geometry, card detection, OpenCV loaders, storage, processing, states, camera, face tracker, worker, AI check |
| `web/.verification-data/` | Captures in development (git-ignored). Live: the `verification` bucket |
| `src/lib/verification/crypto.ts`, `blob-store.ts`, `access.ts` | Encryption at rest, where files are stored, who may see them |
| `web/scripts/` | `setup-verification.mjs` (runtime and model, after install), `dev-https.mjs` (phone testing) |
