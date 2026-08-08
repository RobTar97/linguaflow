import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { PACK_LIMITS, validatePackDocument } from "./validator";
import type { PortableTopic, TopicPackDocument, TopicPackManifest, TopicPackValidationResult, ValidationIssue } from "./types";

function failure(code: string, path: string, message: string): TopicPackValidationResult {
  return { valid: false, issues: [{ severity: "error", code, path, message }] };
}
function safePath(path: string) {
  return !path.startsWith("/") && !path.includes("\\") && !path.split("/").includes("..") && !path.includes("\0");
}

export function readTopicPackArchive(bytes: Uint8Array): TopicPackValidationResult {
  if (bytes.byteLength > PACK_LIMITS.archiveBytes) return failure("archive.size", "archive", "The archive exceeds 25 MiB.");
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, { filter: ({ name, originalSize }) => safePath(name) && originalSize <= PACK_LIMITS.uncompressedBytes });
  } catch {
    return failure("archive.invalid", "archive", "The file is not a readable .lfpack ZIP archive.");
  }
  const paths = Object.keys(files);
  if (paths.some((path) => !safePath(path))) return failure("archive.path", "archive", "The archive contains an unsafe path.");
  const total = Object.values(files).reduce((sum, value) => sum + value.byteLength, 0);
  if (total > PACK_LIMITS.uncompressedBytes) return failure("archive.expandedSize", "archive", "Expanded archive content exceeds 50 MiB.");
  const manifestBytes = files["manifest.json"];
  if (!manifestBytes) return failure("manifest.missing", "manifest.json", "manifest.json is required.");
  let manifest: TopicPackManifest;
  try { manifest = JSON.parse(strFromU8(manifestBytes)) as TopicPackManifest; }
  catch { return failure("manifest.json", "manifest.json", "manifest.json is not valid JSON."); }
  const topicPaths = paths.filter((path) => /^topics\/[A-Za-z0-9-]+\.json$/.test(path)).sort();
  const issues: ValidationIssue[] = [];
  const topics: PortableTopic[] = [];
  for (const path of topicPaths) {
    try { topics.push(JSON.parse(strFromU8(files[path])) as PortableTopic); }
    catch { issues.push({ severity: "error", code: "topic.json", path, message: "Topic file is not valid JSON." }); }
  }
  const licensePath = typeof manifest?.license?.file === "string" ? manifest.license.file : "LICENSE";
  const licenseText = files[licensePath] ? strFromU8(files[licensePath]) : "";
  const assets = new Map(paths.filter((path) => path.startsWith("assets/")).map((path) => [path, files[path]]));
  const result = validatePackDocument({ manifest, topics, assets, licenseText });
  return { ...result, issues: [...issues, ...result.issues], valid: issues.length === 0 && result.valid, pack: issues.length === 0 ? result.pack : undefined };
}

export function writeTopicPackArchive(pack: TopicPackDocument): Uint8Array {
  const files: Record<string, Uint8Array> = {
    "manifest.json": strToU8(`${JSON.stringify(pack.manifest, null, 2)}\n`),
    [pack.manifest.license.file]: strToU8(pack.licenseText),
  };
  for (const topic of pack.topics) files[`topics/${topic.id}.json`] = strToU8(`${JSON.stringify(topic, null, 2)}\n`);
  for (const [path, value] of pack.assets) files[path] = value;
  return zipSync(files, { level: 6 });
}
