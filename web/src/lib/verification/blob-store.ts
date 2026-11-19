import "server-only";

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

// Where the identity-verification lab keeps its files.
//   Supabase Storage: the private "verification" bucket in PLAR's own Supabase on the server, when
//     VERIFICATION_STORAGE_URL and VERIFICATION_STORAGE_KEY are set (they are on the live server).
//     The key only opens that bucket; it is not the service key.
//   Local folder: web/.verification-data (git-ignored), for development on this machine.
// Paths look like "sessions/<id>/<file>". Callers encrypt before put and decrypt after get.

export type BlobStore = {
  name: "supabase" | "local";
  put(path: string, data: Buffer): Promise<void>;
  get(path: string): Promise<Buffer | null>;
  remove(paths: string[]): Promise<void>;
  /** The names directly under a folder (one level). */
  list(folder: string): Promise<string[]>;
};

const BUCKET = "verification";

function supabaseStore(url: string, key: string): BlobStore {
  const base = `${url.replace(/\/$/, "")}/storage/v1`;
  const headers = { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? key, Authorization: `Bearer ${key}` };
  const fail = async (what: string, res: Response) => {
    throw new Error(`Storage ${what} failed (${res.status}): ${(await res.text().catch(() => "")).slice(0, 200)}`);
  };
  return {
    name: "supabase",
    async put(path, data) {
      const res = await fetch(`${base}/object/${BUCKET}/${path}`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/octet-stream", "x-upsert": "true", "cache-control": "no-store" },
        body: new Uint8Array(data),
      });
      if (!res.ok) await fail("upload", res);
    },
    async get(path) {
      const res = await fetch(`${base}/object/authenticated/${BUCKET}/${path}`, { headers, cache: "no-store" });
      if (res.status === 400 || res.status === 404) return null;
      if (!res.ok) await fail("download", res);
      return Buffer.from(await res.arrayBuffer());
    },
    async remove(paths) {
      if (!paths.length) return;
      const res = await fetch(`${base}/object/${BUCKET}`, {
        method: "DELETE",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: paths }),
      });
      if (!res.ok) await fail("delete", res);
    },
    async list(folder) {
      const names: string[] = [];
      for (let offset = 0; ; offset += 1000) {
        const res = await fetch(`${base}/object/list/${BUCKET}`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ prefix: folder.replace(/\/?$/, "/"), limit: 1000, offset, sortBy: { column: "name", order: "asc" } }),
          cache: "no-store",
        });
        if (!res.ok) await fail("list", res);
        const page = (await res.json()) as { name: string }[];
        names.push(...page.map((o) => o.name).filter((n) => n && n !== ".emptyFolderPlaceholder"));
        if (page.length < 1000) return names;
      }
    },
  };
}

function localStore(): BlobStore {
  const root = resolve(process.cwd(), ".verification-data");
  const at = (path: string) => join(root, path);
  return {
    name: "local",
    async put(path, data) {
      await mkdir(dirname(at(path)), { recursive: true });
      await writeFile(at(path), data);
    },
    async get(path) {
      return readFile(at(path)).catch(() => null);
    },
    async remove(paths) {
      await Promise.all(paths.map((p) => rm(at(p), { force: true, recursive: true })));
    },
    async list(folder) {
      return readdir(at(folder)).catch(() => []);
    },
  };
}

let store: BlobStore | null = null;
export function blobStore(): BlobStore {
  if (store) return store;
  const url = process.env.VERIFICATION_STORAGE_URL;
  const key = process.env.VERIFICATION_STORAGE_KEY;
  store = url && key ? supabaseStore(url, key) : localStore();
  return store;
}
