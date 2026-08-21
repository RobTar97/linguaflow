import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import KuroshiroModule from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import { topicCatalog } from "../src/catalog/topicCatalog";

interface KuromojiToken {
  surface_form: string;
  reading?: string;
}

interface ReadingEntry {
  segments: Array<{ text: string; reading?: string }>;
  romaji: string;
}

const Kuroshiro = KuroshiroModule.default;
const analyzer = new KuromojiAnalyzer();
const kuroshiro = new Kuroshiro();
const texts = new Set<string>();
const hasKanji = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;

function add(value: string | undefined) {
  if (value?.trim() && /[\u3040-\u30ff\u3400-\u9fff]/u.test(value)) {
    texts.add(value.trim());
  }
}

for (const topic of topicCatalog.all()) {
  add(topic.title.JA);
  add(topic.description.JA);
  add(topic.mainPrompt.JA);
  topic.followUps.JA.forEach(add);
  topic.vocabulary.JA.forEach((item) => {
    add(item.word);
    add(item.translation);
    add(item.part);
  });
  topic.facilitation?.objectives.JA.forEach(add);
  topic.facilitation?.tips.JA.forEach(add);
  add(topic.facilitation?.preparation.JA);
  add(topic.facilitation?.warmUp.JA);
  add(topic.facilitation?.easier.JA);
  add(topic.facilitation?.harder.JA);
  add(topic.facilitation?.sensitiveContent?.JA);
}

await kuroshiro.init(analyzer);

const readings: Record<string, ReadingEntry> = {};
for (const text of [...texts].sort((a, b) => a.localeCompare(b, "ja"))) {
  const tokens = (await analyzer.parse(text)) as KuromojiToken[];
  readings[text] = {
    segments: tokens.map((token) => ({
      text: token.surface_form,
      ...(hasKanji.test(token.surface_form) && token.reading
        ? { reading: Kuroshiro.Util.kanaToHiragna(token.reading) }
        : {}),
    })),
    romaji: await kuroshiro.convert(text, { to: "romaji", mode: "normal" }),
  };
}

const output = resolve("public/data/japanese-readings.json");
await writeFile(output, `${JSON.stringify(readings)}\n`, "utf8");
console.log(`Japanese readings: ${Object.keys(readings).length} entries → ${output}`);
