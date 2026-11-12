import "server-only";

import sharp from "sharp";
import { getSession, readArtifact, updateSession, type Artifact, type VerificationSession } from "@/lib/verification/storage";

// AI-assisted identity check for the verification lab: compares the face photo with the ID portrait
// and reads the ID's details. It only suggests; a person decides. Requests go through OpenRouter and
// ask for providers that don't collect data for training (provider.data_collection = "deny").

export type IdField = { label: string; value: string };

export type AiCheckResult = {
  face_match: {
    /** 0–100: how likely the face photo and the ID portrait show the same person. */
    probability_same_person: number;
    verdict: "likely_same" | "uncertain" | "likely_different";
    reasons: string[];
  };
  id_front: {
    document_type: string;
    issuing_authority: string;
    full_name: string;
    given_names: string;
    surname: string;
    date_of_birth: string;
    sex: string;
    document_number: string;
    issue_date: string;
    expiry_date: string;
    address: string;
    other_fields: IdField[];
  };
  id_back: { summary: string; fields: IdField[]; machine_readable_text: string };
  image_quality: string[];
  concerns: string[];
};

export type AiCheck = {
  status: "running" | "done" | "error";
  model: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  /** The captures that were sent, so a retake can trigger a fresh check. */
  inputs: { face: string; idFront: string; idBack: string };
  result?: AiCheckResult;
  error?: string;
  usage?: { promptTokens?: number; completionTokens?: number; cost?: number };
};

export const aiModel = () => process.env.VERIFICATION_AI_MODEL || "google/gemini-3.5-flash-lite";
export const aiEnabled = () => Boolean(process.env.OPENROUTER_API_KEY) && process.env.VERIFICATION_AI !== "off";

const text = { type: "string" } as const;
const fieldList = { type: "array", items: { type: "object", properties: { label: text, value: text }, required: ["label", "value"], additionalProperties: false } } as const;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["face_match", "id_front", "id_back", "image_quality", "concerns"],
  properties: {
    face_match: {
      type: "object",
      additionalProperties: false,
      required: ["probability_same_person", "verdict", "reasons"],
      properties: {
        probability_same_person: { type: "number", description: "0 to 100" },
        verdict: { type: "string", enum: ["likely_same", "uncertain", "likely_different"] },
        reasons: { type: "array", items: text },
      },
    },
    id_front: {
      type: "object",
      additionalProperties: false,
      required: ["document_type", "issuing_authority", "full_name", "given_names", "surname", "date_of_birth", "sex", "document_number", "issue_date", "expiry_date", "address", "other_fields"],
      properties: {
        document_type: text,
        issuing_authority: text,
        full_name: text,
        given_names: text,
        surname: text,
        date_of_birth: text,
        sex: text,
        document_number: text,
        issue_date: text,
        expiry_date: text,
        address: text,
        other_fields: fieldList,
      },
    },
    id_back: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "fields", "machine_readable_text"],
      properties: { summary: text, fields: fieldList, machine_readable_text: text },
    },
    image_quality: { type: "array", items: text },
    concerns: { type: "array", items: text },
  },
};

const instructions = `You help a human reviewer at a university confirm a student's identity before an assessment interview. You do not make the decision; the reviewer does.

You get three images:
1. A photo of the person's face, taken just now.
2. A photo of the front of their photo ID, as taken: the card may be held in a hand and slightly tilted, with background around it.
3. A photo of the back of the same ID, as taken.

Do two things:
A. Compare the face in image 1 with the portrait on the ID in image 2. Give probability_same_person from 0 to 100, a verdict, and short, specific reasons (face shape, features, apparent age, anything that limits the comparison). If the ID has no portrait or the face isn't visible, say so and use "uncertain".
B. Read every piece of text on both sides of the ID. Fill the named fields from the front; put any other labelled values in other_fields. For the back, summarise what it shows, list labelled values, and copy any machine-readable text (MRZ lines, barcode text) exactly.

Rules: Copy text exactly as printed. Use YYYY-MM-DD for dates when you can read the full date, otherwise copy as printed. Use an empty string for anything absent or unreadable; never guess. In concerns, note anything a reviewer should know: the card looks like a sample or specimen, a photo of a screen or printout, an expired document, details that disagree between sides, or signs of editing. In image_quality, note blur, glare, cropping or poor lighting.`;

/** Downscaled JPEG data URL. ID photos keep more pixels: the card fills only part of the shot. */
async function toDataUrl(data: Buffer, longSide = 1024) {
  const jpeg = await sharp(data).rotate().resize({ width: longSide, height: longSide, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

/**
 * The three captures the check needs: the face and the original photos of each ID side. The originals,
 * not the straightened copies, so a straightening mistake can never hide or distort the card.
 */
export function checkInputs(session: VerificationSession) {
  const face = session.artifacts.find((a) => a.kind === "face");
  const idFront = session.artifacts.find((a) => a.kind === "id-front");
  const idBack = session.artifacts.find((a) => a.kind === "id-back");
  return face && idFront && idBack ? { face, idFront, idBack } : null;
}

async function callModel(session: VerificationSession, inputs: { face: Artifact; idFront: Artifact; idBack: Artifact }) {
  const [face, front, back] = await Promise.all(
    [inputs.face, inputs.idFront, inputs.idBack].map(async (a) => toDataUrl(await readArtifact(session.id, a), a.kind === "face" ? 1024 : 1600)),
  );
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "PLAR verification lab",
    },
    body: JSON.stringify({
      model: aiModel(),
      temperature: 0,
      messages: [
        { role: "system", content: instructions },
        {
          role: "user",
          content: [
            { type: "text", text: "Image 1: face photo." },
            { type: "image_url", image_url: { url: face } },
            { type: "text", text: "Image 2: photo of the ID front." },
            { type: "image_url", image_url: { url: front } },
            { type: "text", text: "Image 3: photo of the ID back." },
            { type: "image_url", image_url: { url: back } },
          ],
        },
      ],
      response_format: { type: "json_schema", json_schema: { name: "identity_check", strict: true, schema } },
      // Only route to providers that don't store or train on the data.
      provider: { data_collection: "deny" },
      usage: { include: true },
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
  } | null;
  if (!res.ok || !body?.choices?.[0]?.message?.content) {
    throw new Error(body?.error?.message ?? `The AI service answered ${res.status}`);
  }
  const content = body.choices[0].message.content.replace(/^```(?:json)?\s*|\s*```$/g, "");
  const result = JSON.parse(content) as AiCheckResult;
  result.face_match.probability_same_person = Math.max(0, Math.min(100, Math.round(Number(result.face_match.probability_same_person) || 0)));
  return { result, usage: { promptTokens: body.usage?.prompt_tokens, completionTokens: body.usage?.completion_tokens, cost: body.usage?.cost } };
}

/**
 * Runs the check when the face and both ID sides are in, unless an up-to-date result exists.
 * `force` reruns it regardless (the "Run again" button).
 */
export async function runAiCheck(sessionId: string, { force = false } = {}) {
  if (!aiEnabled()) return null;
  const session = await getSession(sessionId);
  if (!session) return null;
  const inputs = checkInputs(session);
  if (!inputs) return null;
  const ids = { face: inputs.face.id, idFront: inputs.idFront.id, idBack: inputs.idBack.id };
  const current = session.aiCheck;
  const sameInputs = current && current.inputs.face === ids.face && current.inputs.idFront === ids.idFront && current.inputs.idBack === ids.idBack;
  if (!force && sameInputs && current.status !== "error") return session;

  const started = Date.now();
  const check: AiCheck = { status: "running", model: aiModel(), startedAt: new Date().toISOString(), inputs: ids };
  await updateSession(sessionId, (s) => {
    s.aiCheck = check;
  });
  try {
    const { result, usage } = await callModel(session, inputs);
    return await updateSession(sessionId, (s) => {
      // A newer check (after a retake) wins over this one.
      if (s.aiCheck?.startedAt !== check.startedAt) return;
      s.aiCheck = { ...check, status: "done", result, usage, finishedAt: new Date().toISOString(), durationMs: Date.now() - started };
    });
  } catch (error) {
    return await updateSession(sessionId, (s) => {
      if (s.aiCheck?.startedAt !== check.startedAt) return;
      s.aiCheck = { ...check, status: "error", error: error instanceof Error ? error.message : String(error), finishedAt: new Date().toISOString(), durationMs: Date.now() - started };
    });
  }
}
