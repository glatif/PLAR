// One-off move of identity-verification captures from the old Docker volume (plain files in
// /app/.verification-data/sessions) into PLAR's Supabase Storage bucket, encrypted the same way the
// web app encrypts them (AES-256-GCM, "PLR1" format). Run inside the web container, which has the
// lab's storage key and encryption key in its environment:
//   docker exec -i plar node - [--delete] < server/migrate-lab-captures.cjs
// Each file is uploaded, downloaded again, decrypted and compared byte for byte. With --delete, the
// plain originals are removed only after every file in their session matched.
const { createCipheriv, createDecipheriv, createHash, randomBytes } = require("node:crypto");
const { readdirSync, readFileSync, rmSync } = require("node:fs");
const { join } = require("node:path");

const ROOT = "/app/.verification-data/sessions";
const del = process.argv.includes("--delete");
const url = process.env.VERIFICATION_STORAGE_URL;
const token = process.env.VERIFICATION_STORAGE_KEY;
const apikey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const key = Buffer.from(process.env.VERIFICATION_ENCRYPTION_KEY || "", "base64");
if (!url || !token || key.length !== 32) {
  console.error("Missing VERIFICATION_STORAGE_URL, VERIFICATION_STORAGE_KEY or VERIFICATION_ENCRYPTION_KEY");
  process.exit(1);
}
const MAGIC = Buffer.from("PLR1");
const headers = { apikey, Authorization: `Bearer ${token}` };
const base = `${url.replace(/\/$/, "")}/storage/v1`;

const encrypt = (data) => {
  if (data.subarray(0, 4).equals(MAGIC)) return data;
  const nonce = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, nonce);
  const body = Buffer.concat([c.update(data), c.final()]);
  return Buffer.concat([MAGIC, nonce, c.getAuthTag(), body]);
};
const decrypt = (data) => {
  if (!data.subarray(0, 4).equals(MAGIC)) return data;
  const d = createDecipheriv("aes-256-gcm", key, data.subarray(4, 16));
  d.setAuthTag(data.subarray(16, 32));
  return Buffer.concat([d.update(data.subarray(32)), d.final()]);
};
const sha = (b) => createHash("sha256").update(b).digest("hex");

(async () => {
  let ids = [];
  try {
    ids = readdirSync(ROOT).filter((d) => /^[a-z0-9-]{8,64}$/.test(d));
  } catch {
    console.log("Nothing to move: no old captures.");
    return;
  }
  let moved = 0;
  for (const id of ids) {
    const names = readdirSync(join(ROOT, id)).filter((n) => /^[a-z0-9.-]+$/.test(n));
    let ok = true;
    for (const name of names) {
      const plain = decrypt(readFileSync(join(ROOT, id, name)));
      const path = `sessions/${id}/${name}`;
      const up = await fetch(`${base}/object/verification/${path}`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/octet-stream", "x-upsert": "true" },
        body: encrypt(plain),
      });
      if (!up.ok) {
        console.error(`  ✗ ${path}: upload ${up.status}`);
        ok = false;
        continue;
      }
      const back = await fetch(`${base}/object/authenticated/verification/${path}`, { headers });
      const stored = Buffer.from(await back.arrayBuffer());
      const same = back.ok && stored.subarray(0, 4).equals(MAGIC) && sha(decrypt(stored)) === sha(plain);
      console.log(`  ${same ? "✓" : "✗"} ${path} (${plain.length} bytes, stored encrypted)`);
      if (!same) ok = false;
      else moved++;
    }
    if (ok && del) {
      rmSync(join(ROOT, id), { recursive: true, force: true });
      console.log(`  removed the plain copy of ${id}`);
    }
  }
  console.log(`Moved ${moved} files from ${ids.length} sessions.`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
