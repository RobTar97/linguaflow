import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  ".vite",
  ".wrangler",
  "dist",
  "node_modules",
]);
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsonc",
  ".md",
  ".mjs",
  ".svg",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

const credentialPatterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ["OpenAI key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/],
  ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
];

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesIn(path)));
    else if (textExtensions.has(extname(entry.name)) || entry.name.startsWith(".env")) {
      files.push(path);
    }
  }
  return files;
}

const findings = [];
const files = await filesIn(root);
for (const path of files) {
  const content = await readFile(path, "utf8");
  for (const [label, pattern] of credentialPatterns) {
    if (pattern.test(content)) {
      findings.push(`${relative(root, path)}: possible ${label}`);
    }
  }
}

if (findings.length) {
  console.error("Potential credentials detected:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(`Secret check passed (${files.length} text files scanned).`);
}
