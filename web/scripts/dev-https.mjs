// Runs the dev server over HTTPS on this computer's network address, so a phone on the same Wi-Fi
// can open the camera (browsers only allow cameras on secure pages). Usage: npm run dev:phone
//
// The certificate comes from mkcert and covers localhost and this machine's current network
// addresses. Phones don't trust it unless mkcert's root is installed on them, so the first visit
// shows a "not private" warning: choose to continue (Safari: Show Details › visit this website).

import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PORT ?? "3443";
const certDir = join(root, "certificates");
const key = join(certDir, "dev-key.pem");
const cert = join(certDir, "dev.pem");
const stamp = join(certDir, "hosts.txt");

const lan = Object.values(networkInterfaces())
  .flat()
  .filter((a) => a && a.family === "IPv4" && !a.internal)
  .map((a) => a.address);
const hosts = ["localhost", "127.0.0.1", ...lan];

try {
  execFileSync("mkcert", ["-help"], { stdio: "ignore" });
} catch {
  console.error("mkcert isn't installed. Install it with: brew install mkcert");
  process.exit(1);
}

mkdirSync(certDir, { recursive: true });
const fresh = existsSync(cert) && existsSync(stamp) && readFileSync(stamp, "utf8") === hosts.join(" ");
if (!fresh) {
  execFileSync("mkcert", ["-key-file", key, "-cert-file", cert, ...hosts], { stdio: "inherit" });
  writeFileSync(stamp, hosts.join(" "));
}

console.log("\n  Open the verification lab on your phone (same Wi-Fi):");
for (const ip of lan) console.log(`    https://${ip}:${port}/verify`);
console.log(`  Testing gallery: https://${lan[0] ?? "localhost"}:${port}/testing\n`);

const child = spawn("npx", ["next", "dev", "-H", "0.0.0.0", "-p", port, "--experimental-https", "--experimental-https-key", key, "--experimental-https-cert", cert], {
  cwd: root,
  stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 0));
