import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  inspectTopicPackArchive,
  inspectTopicPackDocument,
  writeAcceptedTopicPack,
} from "../src/packs/intake";
import type { PortableTopic, TopicPackManifest } from "../src/packs/types";

async function loadDirectory(directory: string) {
  const manifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8")) as TopicPackManifest;
  const topicDirectory = path.join(directory, "topics");
  const topics = await Promise.all(
    (await readdir(topicDirectory)).filter((name) => name.endsWith(".json")).sort().map(async (name) =>
      JSON.parse(await readFile(path.join(topicDirectory, name), "utf8")) as PortableTopic,
    ),
  );
  const assets = new Map<string, Uint8Array>();
  const assetDirectory = path.join(directory, "assets");
  try {
    for (const name of await readdir(assetDirectory)) assets.set(`assets/${name}`, await readFile(path.join(assetDirectory, name)));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const licenseText = await readFile(path.join(directory, manifest.license.file), "utf8");
  return inspectTopicPackDocument({ manifest, topics, assets, licenseText });
}

const [, , command, input, output] = process.argv;
if (!command || !input || !["validate", "build"].includes(command)) {
  console.error("Usage: npm run pack:validate -- <file.lfpack|directory>\n       npm run pack:build -- <directory> [output.lfpack]");
  process.exit(2);
}

const result = input.endsWith(".lfpack")
  ? inspectTopicPackArchive(await readFile(input))
  : await loadDirectory(input);

for (const item of result.validation.issues) console.log(`${item.severity.toUpperCase()} ${item.code} ${item.path}: ${item.message}`);
if (!result.accepted) process.exit(1);

if (command === "build") {
  const destination = output ?? `${result.accepted.record.manifest.id}-${result.accepted.record.manifest.version}.lfpack`;
  await writeFile(destination, writeAcceptedTopicPack(result.accepted));
  console.log(`Built ${destination} (${result.accepted.document.topics.length} topics).`);
} else {
  console.log(`Valid ${result.accepted.record.manifest.id}@${result.accepted.record.manifest.version} (${result.accepted.document.topics.length} topics).`);
}
