// Pre-publication check: run `node check.mjs` after building, before anything is pushed or published.
// It fails on anything that should never be public. It is a safety net, not the review itself:
// screenshots still need a person to look at every pixel (see REVIEW.md).
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const scan = ["docs", "content", "assets", "README.md", "REVIEW.md", "PUBLISHING.md", "LICENSE", "build.mjs"];

// Generic patterns only: this file is public. Names of private machines, people, volumes, and the
// private repository live in a private list (one per line, never committed here), passed with
// SHOWCASE_PRIVATE_TERMS=<path to that file>. Without it the check refuses to say "OK".
const FORBIDDEN = [
  [/\b(?:10|127|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}(?:\.\d{1,3})?\b/, "a private IP address"],
  [/\b100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}\b/, "a Tailscale address"],
  [/\.ts\.net\b/i, "a Tailscale network name"],
  [/\/mnt\/|\/srv\/|\/home\/[a-z]|[A-Z]:\\\\|M:\//, "a filesystem path"],
  [/[A-Za-z0-9._%+-]+@(?!example\.)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, "an email address"],
  [/\b(?:ghp|gho|github_pat|sk-ant|sk|xox[abp])[-_][A-Za-z0-9_-]{16,}/, "something that looks like a token"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "a private key"],
  [/\b[a-f0-9]{32,64}\b/i, "a long hex string (key, hash, or id)"],
  [/sourceMappingURL|\.map["')]/, "a source map reference"],
  [/<script\b/i, "a script tag (the site is meant to have none)"],
];
// Links may only point at the page itself, GitHub, and well-known documentation.
const ALLOWED_ORIGINS = ["https://github.com", "https://jpdexter101-lang.github.io"];

const termsFile = process.env.SHOWCASE_PRIVATE_TERMS;
if (!termsFile) {
  console.error("Set SHOWCASE_PRIVATE_TERMS to the private terms list before checking.");
  process.exit(2);
}
const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
for (const term of readFileSync(termsFile, "utf8").split(/\r?\n/).map((t) => t.trim()).filter((t) => t && !t.startsWith("#")))
  FORBIDDEN.push([new RegExp(escapeRe(term), "i"), "a private name from the private list"]);

const failures = [];
const files = [];
const walk = (p) => {
  const full = path.join(root, p);
  let s;
  try { s = statSync(full); } catch { return; }
  if (s.isDirectory()) for (const f of readdirSync(full)) walk(path.join(p, f));
  else files.push(p);
};
scan.forEach(walk);

const text = /\.(html|css|xml|json|md|txt|svg)$/i;
for (const f of files) {
  const buf = readFileSync(path.join(root, f));
  if (f.endsWith(".map")) failures.push(`${f}: source map file`);
  if (text.test(f)) {
    const s = buf.toString("utf8");
    s.split("\n").forEach((line, i) => {
      for (const [re, what] of FORBIDDEN) if (re.test(line)) failures.push(`${f}:${i + 1}: ${what}: ${line.trim().slice(0, 120)}`);
      for (const m of line.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)) {
        const url = m[1];
        if (!ALLOWED_ORIGINS.some((o) => url.startsWith(o))) failures.push(`${f}:${i + 1}: link to an unexpected site: ${url}`);
      }
    });
  }
  // Images: no hidden text, location, camera, or editing metadata.
  if (/\.png$/i.test(f)) {
    let o = 8;
    while (o < buf.length) {
      const len = buf.readUInt32BE(o);
      const type = buf.toString("ascii", o + 4, o + 8);
      if (["tEXt", "iTXt", "zTXt", "eXIf", "tIME"].includes(type)) failures.push(`${f}: PNG metadata chunk ${type} (strip it)`);
      o += 12 + len;
    }
  }
  if (/\.webp$/i.test(f)) {
    for (const tag of ["EXIF", "XMP "]) if (buf.includes(Buffer.from(tag, "ascii"))) failures.push(`${f}: WebP ${tag.trim()} metadata (strip it)`);
  }
  if (/\.(jpe?g)$/i.test(f) && buf.includes(Buffer.from("Exif", "ascii"))) failures.push(`${f}: JPEG EXIF metadata (strip it)`);
}

if (failures.length) {
  console.error(`Not safe to publish (${failures.length}):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`OK: ${files.length} files checked, nothing private found. Screenshots still need a person's review (REVIEW.md).`);
