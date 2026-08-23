import type { Topic } from "../domain/types";
import { readTopicPackArchive, writeTopicPackArchive } from "./archive";
import { installedRecord, topicsFromInstalledPack } from "./normalize";
import type { InstalledPackRecord, TopicPackDocument, TopicPackValidationResult } from "./types";
import { validatePackDocument } from "./validator";

export interface AcceptedTopicPack {
  readonly document: TopicPackDocument;
  readonly record: InstalledPackRecord;
  readonly topics: readonly Topic[];
}

export interface TopicPackIntake {
  readonly validation: TopicPackValidationResult;
  readonly accepted?: AcceptedTopicPack;
}

export interface TopicPackDocumentInput {
  manifest: unknown;
  topics: unknown[];
  assets: Map<string, Uint8Array>;
  licenseText: string;
}

function intake(validation: TopicPackValidationResult): TopicPackIntake {
  if (!validation.valid || !validation.pack) return { validation };
  const record = installedRecord(validation.pack);
  return {
    validation,
    accepted: {
      document: validation.pack,
      record,
      topics: topicsFromInstalledPack(record),
    },
  };
}

export function inspectTopicPackArchive(bytes: Uint8Array): TopicPackIntake {
  return intake(readTopicPackArchive(bytes));
}

export function inspectTopicPackDocument(input: TopicPackDocumentInput): TopicPackIntake {
  return intake(validatePackDocument(input));
}

export function writeAcceptedTopicPack(accepted: AcceptedTopicPack) {
  return writeTopicPackArchive(accepted.document);
}
