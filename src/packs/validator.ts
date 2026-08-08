import type { Category, Locale } from "../domain/types";
import {
  TOPIC_PACK_SCHEMA_VERSION,
  type PortableTopic,
  type TopicPackDocument,
  type TopicPackManifest,
  type TopicPackValidationResult,
  type ValidationIssue,
} from "./types";

export const PACK_LIMITS = {
  archiveBytes: 25 * 1024 * 1024,
  uncompressedBytes: 50 * 1024 * 1024,
  assetBytes: 1024 * 1024,
  topicCount: 100,
} as const;

const locales = new Set<Locale>(["EN", "PL", "JA"]);
const levels = new Set(["A1", "A2", "B1", "B2", "C1"]);
const categories = new Set<Category>([
  "Daily Life", "Work & Career", "Travel & Culture", "People & Relationships",
  "Technology", "Health & Wellness", "Education", "Environment", "Food & Cooking",
  "Arts & Media", "Science & Nature", "Society & Ideas",
]);

const issue = (
  severity: ValidationIssue["severity"],
  code: string,
  path: string,
  message: string,
): ValidationIssue => ({ severity, code, path, message });

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function manifestFrom(value: unknown, issues: ValidationIssue[]): TopicPackManifest | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    issues.push(issue("error", "manifest.schema", "manifest", "Expected a manifest object."));
    return undefined;
  }
  const manifest = value as Partial<TopicPackManifest>;
  if (manifest.schemaVersion !== TOPIC_PACK_SCHEMA_VERSION) issues.push(issue("error", "manifest.schemaVersion", "manifest.schemaVersion", `Unsupported schema ${String(manifest.schemaVersion)}.`));
  if (!nonEmpty(manifest.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.id) || manifest.id.length > 60) issues.push(issue("error", "manifest.id", "manifest.id", "Use a lowercase kebab-case pack id up to 60 characters."));
  if (!nonEmpty(manifest.version) || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version)) issues.push(issue("error", "manifest.version", "manifest.version", "Use a semantic version such as 1.0.0."));
  if (!manifest.defaultLocale || !locales.has(manifest.defaultLocale)) issues.push(issue("error", "manifest.defaultLocale", "manifest.defaultLocale", "Choose a supported default locale."));
  if (!Array.isArray(manifest.locales) || !manifest.locales.length || manifest.locales.some((item) => !locales.has(item)) || new Set(manifest.locales).size !== manifest.locales.length) issues.push(issue("error", "manifest.locales", "manifest.locales", "List one or more unique supported locales."));
  if (!manifest.license || !nonEmpty(manifest.license.spdx) || !/^LICENSE(?:\.[A-Za-z0-9-]+)?$/.test(manifest.license.file ?? "")) issues.push(issue("error", "manifest.license", "manifest.license", "Provide an SPDX identifier and root LICENSE file."));
  if (!Array.isArray(manifest.authors) || !manifest.authors.length || manifest.authors.some((author) => !nonEmpty(author?.displayName))) issues.push(issue("error", "manifest.authors", "manifest.authors", "Provide at least one author display name."));
  if (!manifest.compatibility || !nonEmpty(manifest.compatibility.linguaflow)) issues.push(issue("error", "manifest.compatibility", "manifest.compatibility.linguaflow", "Declare LinguaFlow compatibility."));
  if (issues.some((item) => item.severity === "error")) return undefined;
  return manifest as TopicPackManifest;
}

function validateLocalized(
  value: unknown,
  path: string,
  required: readonly Locale[],
  issues: ValidationIssue[],
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    issues.push(issue("error", "localized.invalid", path, "Expected a localized text object."));
    return;
  }
  const localized = value as Partial<Record<Locale, unknown>>;
  for (const locale of required) {
    if (!nonEmpty(localized[locale])) {
      issues.push(issue("error", "localized.missing", `${path}.${locale}`, `A ${locale} value is required.`));
    }
  }
}

function validateTopic(
  value: unknown,
  index: number,
  manifest: TopicPackManifest,
  assets: Map<string, Uint8Array>,
): { topic?: PortableTopic; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const path = `topics[${index}]`;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { issues: [issue("error", "topic.invalid", path, "Expected a topic object.")] };
  }
  const topic = value as PortableTopic;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topic.id ?? "")) {
    issues.push(issue("error", "topic.id", `${path}.id`, "Use a lowercase kebab-case topic id."));
  }
  if (!levels.has(topic.level)) issues.push(issue("error", "topic.level", `${path}.level`, "Unsupported CEFR level."));
  if (!categories.has(topic.category)) issues.push(issue("error", "topic.category", `${path}.category`, "Unsupported category."));
  if (!Array.isArray(topic.languages) || topic.languages.length !== 2 || topic.languages[0] === topic.languages[1] || topic.languages.some((item) => !locales.has(item))) {
    issues.push(issue("error", "topic.languages", `${path}.languages`, "Choose two different supported languages."));
  }
  const requiredLocales = Array.from(new Set([manifest.defaultLocale, ...(topic.languages ?? [])])).filter((item): item is Locale => locales.has(item));
  validateLocalized(topic.title, `${path}.title`, requiredLocales, issues);
  validateLocalized(topic.description, `${path}.description`, requiredLocales, issues);
  validateLocalized(topic.mainPrompt, `${path}.mainPrompt`, requiredLocales, issues);
  for (const locale of requiredLocales) {
    const questions = topic.followUps?.[locale];
    if (!Array.isArray(questions) || questions.length < 5 || questions.some((item) => !nonEmpty(item))) {
      issues.push(issue("error", "topic.followUps", `${path}.followUps.${locale}`, "Provide at least five non-empty follow-up questions."));
    } else if (new Set(questions.map((item) => item.trim())).size !== questions.length) {
      issues.push(issue("error", "topic.followUps.duplicate", `${path}.followUps.${locale}`, "Follow-up questions must be unique."));
    }
    const words = topic.vocabulary?.[locale];
    if (!Array.isArray(words) || words.length < 5 || words.length > 12 || words.some((item) => !nonEmpty(item?.word) || !nonEmpty(item?.translation) || !nonEmpty(item?.part))) {
      issues.push(issue("error", "topic.vocabulary", `${path}.vocabulary.${locale}`, "Provide 5–12 complete vocabulary items."));
    }
  }
  const duration = topic.facilitation?.durationMinutes;
  const group = topic.facilitation?.groupSize;
  if (!duration || !Number.isInteger(duration.min) || !Number.isInteger(duration.max) || duration.min < 5 || duration.max > 180 || duration.min > duration.max) {
    issues.push(issue("error", "topic.facilitation.duration", `${path}.facilitation.durationMinutes`, "Duration must be a valid 5–180 minute range."));
  }
  if (!group || !Number.isInteger(group.min) || !Number.isInteger(group.max) || group.min < 1 || group.max > 100 || group.min > group.max) {
    issues.push(issue("error", "topic.facilitation.group", `${path}.facilitation.groupSize`, "Group size must be a valid 1–100 range."));
  }
  if (topic.artwork) {
    if (!/^assets\/[A-Za-z0-9._/-]+\.(?:png|jpe?g|webp)$/i.test(topic.artwork.path) || topic.artwork.path.includes("..")) {
      issues.push(issue("error", "topic.artwork.path", `${path}.artwork.path`, "Artwork must be a PNG, JPEG, or WebP file under assets/."));
    } else if (!assets.has(topic.artwork.path)) {
      issues.push(issue("error", "topic.artwork.missing", `${path}.artwork.path`, "The referenced artwork is missing from the archive."));
    }
  }
  return { topic: issues.some((item) => item.severity === "error") ? undefined : topic, issues };
}

export function validatePackDocument(input: {
  manifest: unknown;
  topics: unknown[];
  assets: Map<string, Uint8Array>;
  licenseText: string;
}): TopicPackValidationResult {
  const issues: ValidationIssue[] = [];
  const manifest = manifestFrom(input.manifest, issues);
  if (!manifest) return { valid: false, issues };
  if (!manifest.locales.includes(manifest.defaultLocale)) {
    issues.push(issue("error", "manifest.defaultLocale", "manifest.defaultLocale", "The default locale must be listed in locales."));
  }
  validateLocalized(manifest.title, "manifest.title", [manifest.defaultLocale], issues);
  validateLocalized(manifest.description, "manifest.description", [manifest.defaultLocale], issues);
  if (!input.licenseText.trim()) issues.push(issue("error", "license.empty", manifest.license.file, "The license file is empty."));
  if (input.topics.length === 0 || input.topics.length > PACK_LIMITS.topicCount) {
    issues.push(issue("error", "topics.count", "topics", `A pack must contain 1–${PACK_LIMITS.topicCount} topics.`));
  }
  const ids = new Set<string>();
  const validTopics: PortableTopic[] = [];
  input.topics.forEach((value, index) => {
    const result = validateTopic(value, index, manifest, input.assets);
    issues.push(...result.issues);
    if (result.topic) {
      if (ids.has(result.topic.id)) issues.push(issue("error", "topic.duplicate", `topics[${index}].id`, `Duplicate topic id ${result.topic.id}.`));
      ids.add(result.topic.id);
      validTopics.push(result.topic);
    }
  });
  for (const [path, bytes] of input.assets) {
    if (bytes.byteLength > PACK_LIMITS.assetBytes) issues.push(issue("error", "asset.size", path, "Each image must be 1 MiB or smaller."));
  }
  if (!(manifest.reviews?.length)) issues.push(issue("warning", "review.unverified", "manifest.reviews", "No review assertions are included; the pack will be shown as unreviewed."));
  const valid = !issues.some((item) => item.severity === "error");
  const pack: TopicPackDocument | undefined = valid
    ? { manifest, topics: validTopics, assets: input.assets, licenseText: input.licenseText }
    : undefined;
  return { valid, issues, pack };
}
