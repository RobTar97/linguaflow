import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readTopicPackArchive, writeTopicPackArchive } from "../src/packs/archive";
import { validatePackDocument } from "../src/packs/validator";
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
  return validatePackDocument({ manifest, topics, assets, licenseText });
}

const [, , command, input, output] = process.argv;
if (!command || !input || !["validate", "build"].includes(command)) {
  console.error("Usage: npm run pack:validate -- <file.lfpack|directory>\n       npm run pack:build -- <directory> [output.lfpack]");
  process.exit(2);
}

const result = input.endsWith(".lfpack")
  ? readTopicPackArchive(await readFile(input))
  : await loadDirectory(input);

for (const item of result.issues) console.log(`${item.severity.toUpperCase()} ${item.code} ${item.path}: ${item.message}`);
if (!result.valid || !result.pack) process.exit(1);

if (command === "build") {
  const destination = output ?? `${result.pack.manifest.id}-${result.pack.manifest.version}.lfpack`;
  await writeFile(destination, writeTopicPackArchive(result.pack));
  console.log(`Built ${destination} (${result.pack.topics.length} topics).`);
} else {
  console.log(`Valid ${result.pack.manifest.id}@${result.pack.manifest.version} (${result.pack.topics.length} topics).`);
}
