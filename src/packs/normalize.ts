import type { FacilitationGuide, Locale, LocalizedText, Topic } from "../domain/types";
import type { InstalledPackRecord, PortableTopic, TopicPackDocument } from "./types";

const supportedLocales: Locale[] = ["EN", "PL", "JA"];
const objectUrlCache = new WeakMap<Blob, string>();

function objectUrlFor(blob: Blob) {
  const existing = objectUrlCache.get(blob);
  if (existing) return existing;
  const created = URL.createObjectURL(blob);
  objectUrlCache.set(blob, created);
  return created;
}

function text(value: Partial<Record<Locale, string>> | undefined, fallback: Locale): LocalizedText {
  const base = value?.[fallback]?.trim() || Object.values(value ?? {}).find((item) => item?.trim()) || "Untitled";
  return Object.fromEntries(supportedLocales.map((locale) => [locale, value?.[locale]?.trim() || base])) as LocalizedText;
}

function lists(value: Partial<Record<Locale, string[]>> | undefined, fallback: Locale) {
  const base = value?.[fallback] ?? Object.values(value ?? {}).find((item) => item?.length) ?? [];
  return Object.fromEntries(supportedLocales.map((locale) => [locale, value?.[locale]?.length ? value[locale] : base])) as Record<Locale, string[]>;
}

function facilitation(value: PortableTopic["facilitation"], fallback: Locale): FacilitationGuide {
  return {
    durationMinutes: value.durationMinutes,
    groupSize: value.groupSize,
    objectives: lists(value.objectives, fallback),
    preparation: text(value.preparation, fallback),
    warmUp: text(value.warmUp, fallback),
    tips: lists(value.tips, fallback),
    easier: text(value.easier, fallback),
    harder: text(value.harder, fallback),
    ...(value.sensitiveContent ? { sensitiveContent: text(value.sensitiveContent, fallback) } : {}),
  };
}

export function installedRecord(document: TopicPackDocument): InstalledPackRecord {
  return {
    key: `${document.manifest.id}@${document.manifest.version}`,
    manifest: document.manifest,
    topics: document.topics,
    assets: Object.fromEntries(Array.from(document.assets, ([path, bytes]) => [
      path,
      new Blob([Uint8Array.from(bytes).buffer]),
    ])),
    licenseText: document.licenseText,
    installedAt: new Date().toISOString(),
  };
}

export function topicsFromInstalledPack(record: InstalledPackRecord): Topic[] {
  return record.topics.map((item, index) => {
    const objectUrl = item.artwork && record.assets[item.artwork.path]
      ? objectUrlFor(record.assets[item.artwork.path])
      : undefined;
    return {
      id: `${record.manifest.id}:${item.id}`,
      level: item.level,
      languages: item.languages,
      category: item.category,
      title: text(item.title, record.manifest.defaultLocale),
      description: text(item.description, record.manifest.defaultLocale),
      mainPrompt: text(item.mainPrompt, record.manifest.defaultLocale),
      followUps: lists(item.followUps, record.manifest.defaultLocale),
      vocabulary: Object.fromEntries(supportedLocales.map((locale) => {
        const base = item.vocabulary[record.manifest.defaultLocale] ?? Object.values(item.vocabulary).find(Boolean) ?? [];
        return [locale, item.vocabulary[locale] ?? base];
      })) as Topic["vocabulary"],
      artIndex: index % 12,
      artwork: item.artwork
        ? { kind: "asset", path: item.artwork.path, objectUrl }
        : { kind: "atlas", index: index % 12 },
      facilitation: facilitation(item.facilitation, record.manifest.defaultLocale),
      provenance: {
        packId: record.manifest.id,
        packVersion: record.manifest.version,
        license: record.manifest.license.spdx,
        authors: item.authors?.length ? item.authors : record.manifest.authors,
        sourceUrl: record.manifest.source?.url,
        sourceRevision: record.manifest.source?.revision,
        reviews: [...(record.manifest.reviews ?? []), ...(item.reviews ?? [])],
      },
    };
  });
}
