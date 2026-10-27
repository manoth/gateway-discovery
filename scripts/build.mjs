import { createPrivateKey, sign } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const source = JSON.parse(await readFile(path.join(root, "config.json"), "utf8"));
const privateKeyPem = process.env.DISCOVERY_PRIVATE_KEY;
const githubRunNumber = Number(process.env.GITHUB_RUN_NUMBER || 0);
const revision = githubRunNumber > 0 ? 1_000_000 + githubRunNumber : source.revision;

if (!privateKeyPem) {
  throw new Error("DISCOVERY_PRIVATE_KEY is required");
}
if (!Number.isInteger(revision) || revision < 1) {
  throw new Error("config.json revision must be a positive integer");
}
if (!Array.isArray(source.endpoints) || source.endpoints.length === 0) {
  throw new Error("config.json must contain at least one endpoint");
}

for (const endpoint of source.endpoints) {
  const url = new URL(endpoint.url);
  const localDevelopment = url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !localDevelopment) {
    throw new Error(`Endpoint must use HTTPS (localhost is allowed for development): ${endpoint.url}`);
  }
}

const issuedAt = new Date();
const expiresAt = new Date(issuedAt);
expiresAt.setUTCDate(expiresAt.getUTCDate() + (source.expiresInDays ?? 365));

const manifest = {
  schemaVersion: source.schemaVersion ?? 1,
  revision,
  issuedAt: issuedAt.toISOString(),
  expiresAt: expiresAt.toISOString(),
  endpoints: [...source.endpoints].sort((a, b) => a.priority - b.priority),
  minimumAgentVersion: source.minimumAgentVersion ?? "0.1.0",
};

const outputDir = path.join(root, "public");
await mkdir(outputDir, { recursive: true });
const payload = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
const signature = sign(null, payload, createPrivateKey(privateKeyPem)).toString("base64");

await writeFile(path.join(outputDir, "endpoint.json"), payload);
await writeFile(path.join(outputDir, "endpoint.json.sig"), `${signature}\n`);
await writeFile(
  path.join(outputDir, "index.html"),
  `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Health Gateway Discovery</title><style>body{font-family:system-ui,sans-serif;max-width:720px;margin:80px auto;padding:0 24px;color:#163b35}code{background:#eef7f4;padding:3px 7px;border-radius:6px}a{color:#087f6b}</style><h1>Health Gateway Discovery</h1><p>Revision <code>${manifest.revision}</code></p><p>API endpoint <code>${manifest.endpoints[0].url}</code></p><p><a href="./endpoint.json">ดู signed manifest</a></p></html>`,
);

console.log(`Built discovery revision ${manifest.revision}: ${manifest.endpoints[0].url}`);
