import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { decrypt, encrypt, sign, verify } from "@/lib/verification/crypto";
import { redactSession, type VerificationSession } from "@/lib/verification/storage";

// How captures are protected: encrypted at rest, signed cookies, and what the locked list may show.

beforeAll(() => {
  process.env.VERIFICATION_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("encryption at rest", () => {
  it("round-trips, and never stores the plain bytes", () => {
    const plain = Buffer.from("synthetic face photo bytes ".repeat(50));
    const stored = encrypt(plain);
    expect(stored.subarray(0, 4).toString()).toBe("PLR1");
    expect(stored.includes(plain.subarray(0, 40))).toBe(false);
    expect(decrypt(stored).equals(plain)).toBe(true);
  });

  it("uses a fresh nonce for every file", () => {
    const plain = Buffer.from("same input");
    expect(encrypt(plain).equals(encrypt(plain))).toBe(false);
  });

  it("refuses a file that was changed after it was stored", () => {
    const stored = encrypt(Buffer.from("synthetic ID photo"));
    stored[stored.length - 1] ^= 1;
    expect(() => decrypt(stored)).toThrow();
  });

  it("refuses to open it with a different key", () => {
    const stored = encrypt(Buffer.from("synthetic ID photo"));
    process.env.VERIFICATION_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    expect(() => decrypt(stored)).toThrow();
  });

  it("still reads files stored before encryption was switched on", () => {
    const legacy = Buffer.from('{"id":"older-session"}');
    expect(decrypt(legacy).equals(legacy)).toBe(true);
  });
});

describe("signed cookies", () => {
  it("accept their own signature and reject a changed value", () => {
    const signed = sign("unlock:123");
    expect(verify(signed)).toBe("unlock:123");
    expect(verify(signed.replace("unlock:123", "unlock:999"))).toBeNull();
    expect(verify("unlock:123.forged")).toBeNull();
    expect(verify(undefined)).toBeNull();
  });
});

describe("the locked list", () => {
  const session: VerificationSession = {
    id: "20261119-test-0001",
    createdAt: "2026-11-19T10:00:00Z",
    updatedAt: "2026-11-19T10:05:00Z",
    status: "submitted",
    device: { userAgent: "test", viewport: { width: 390, height: 844 }, touch: true, pixelRatio: 3 },
    steps: { face: { outcome: "passed", at: "2026-11-19T10:01:00Z" } },
    review: { decision: "verified", note: "Checked against the synthetic card", at: "2026-11-19T10:06:00Z" },
    artifacts: [{ id: "face-1", kind: "face", file: "face-1.jpg", mime: "image/jpeg", bytes: 10, createdAt: "2026-11-19T10:01:00Z", metrics: { score: 0.9 } }],
    aiCheck: {
      status: "done",
      model: "test",
      startedAt: "2026-11-19T10:02:00Z",
      inputs: { face: "face-1", idFront: "f", idBack: "b" },
      usage: { cost: 0.001 },
      result: {
        face_match: { probability_same_person: 87, verdict: "likely_same", reasons: ["Same jawline"] },
        id_front: {
          document_type: "Driver's licence",
          issuing_authority: "Synthetic",
          full_name: "SAMPLE PERSON",
          given_names: "SAMPLE",
          surname: "PERSON",
          date_of_birth: "1990-01-01",
          sex: "X",
          document_number: "DL-000000",
          issue_date: "2024-01-01",
          expiry_date: "2029-01-01",
          address: "1 Synthetic Way",
          other_fields: [{ label: "Class", value: "5" }],
        },
        id_back: { summary: "Barcode", fields: [{ label: "Code", value: "X" }], machine_readable_text: "MRZ<<<" },
        image_quality: ["Sharp"],
        concerns: ["None"],
      },
    },
  };
  const shown = redactSession(session);
  const text = JSON.stringify(shown);

  it("keeps the name, the match percentage and the decision", () => {
    expect(shown.aiCheck?.result?.id_front.full_name).toBe("SAMPLE PERSON");
    expect(shown.aiCheck?.result?.face_match.probability_same_person).toBe(87);
    expect(shown.review?.decision).toBe("verified");
  });

  it("drops every ID detail, the AI's reasons and the review note", () => {
    for (const secret of ["1990-01-01", "DL-000000", "1 Synthetic Way", "MRZ<<<", "Same jawline", "Checked against", "Barcode"]) {
      expect(text).not.toContain(secret);
    }
  });
});
