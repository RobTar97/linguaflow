import type {
  Category,
  ContributorIdentity,
  FacilitationGuide,
  Level,
  Locale,
  ReviewAssertion,
  VocabularyItem,
} from "../domain/types";

export const TOPIC_PACK_SCHEMA_VERSION = "1.0";

export interface TopicPackManifest {
  schemaVersion: typeof TOPIC_PACK_SCHEMA_VERSION;
  id: string;
  version: string;
  title: Partial<Record<Locale, string>>;
  description: Partial<Record<Locale, string>>;
  defaultLocale: Locale;
  locales: Locale[];
  license: { spdx: string; file: string };
  authors: ContributorIdentity[];
  source?: { url: string; revision?: string };
  compatibility: { linguaflow: string };
  reviews?: ReviewAssertion[];
}
export interface PortableTopic {
  id: string;
  level: Level;
  languages: [Locale, Locale];
  category: Category;
  title: Partial<Record<Locale, string>>;
  description: Partial<Record<Locale, string>>;
  mainPrompt: Partial<Record<Locale, string>>;
  followUps: Partial<Record<Locale, string[]>>;
  vocabulary: Partial<Record<Locale, VocabularyItem[]>>;
  artwork?: { path: string; alt: Partial<Record<Locale, string>> };
  facilitation: Partial<FacilitationGuide> & {
    durationMinutes: { min: number; max: number };
    groupSize: { min: number; max: number };
  };
  authors?: ContributorIdentity[];
  reviews?: ReviewAssertion[];
}

export interface TopicPackDocument {
  manifest: TopicPackManifest;
  topics: PortableTopic[];
  assets: Map<string, Uint8Array>;
  licenseText: string;
}

export interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  path: string;
  message: string;
}

export interface TopicPackValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  pack?: TopicPackDocument;
}

export interface InstalledPackRecord {
  key: string;
  manifest: TopicPackManifest;
  topics: PortableTopic[];
  assets: Record<string, Blob>;
  licenseText: string;
  installedAt: string;
}
