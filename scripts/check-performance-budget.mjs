import { gzipSync } from "node:zlib";
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const DIST_DIR = fileURLToPath(new URL("../dist/", import.meta.url));
const limits = {
  javascriptGzip: 170 * 1024,
  initialJavascriptGzip: 90 * 1024,
  cssGzip: 12 * 1024,
  documentAssetsGzip: 200 * 1024,
  largestHtmlGzip: 8 * 1024,
  totalHtml: 2.5 * 1024 * 1024,
  largestImage: 600 * 1024,
  largestAudio: 16 * 1024,
  totalAudio: 32 * 1024,
};

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    }),
  );
  return files.flat();
}

const files = await walk(DIST_DIR);
const indexHtml = await readFile(join(DIST_DIR, "app", "index.html"), "utf8");
const entryScript =
  indexHtml.match(/<script[^>]+src="\/([^"]+\.js)"/)?.[1] ?? "";
const totals = {
  javascriptGzip: 0,
  initialJavascriptGzip: 0,
  cssGzip: 0,
  documentAssetsGzip: 0,
  largestHtmlGzip: 0,
  totalHtml: 0,
  largestImage: 0,
  largestAudio: 0,
  totalAudio: 0,
};
let largestImageName = "";
let largestAudioName = "";

for (const file of files) {
  const extension = extname(file).toLowerCase();
  const size = (await stat(file)).size;
  if ([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"].includes(extension)) {
    if (size > totals.largestImage) {
      totals.largestImage = size;
      largestImageName = relative(DIST_DIR, file);
    }
    continue;
  }
  if ([".mp3", ".ogg", ".opus", ".wav", ".m4a"].includes(extension)) {
    totals.totalAudio += size;
    if (size > totals.largestAudio) {
      totals.largestAudio = size;
      largestAudioName = relative(DIST_DIR, file);
    }
    continue;
  }
  if (![".html", ".css", ".js"].includes(extension)) continue;

  const gzipSize = gzipSync(await readFile(file)).byteLength;
  if (extension === ".html") {
    totals.totalHtml += size;
    totals.largestHtmlGzip = Math.max(totals.largestHtmlGzip, gzipSize);
    if (relative(DIST_DIR, file).replaceAll("\\", "/") === "app/index.html") {
      totals.documentAssetsGzip += gzipSize;
    }
  }
  if (extension === ".js") {
    totals.javascriptGzip += gzipSize;
    if (relative(DIST_DIR, file).replaceAll("\\", "/") === entryScript) {
      totals.initialJavascriptGzip += gzipSize;
      totals.documentAssetsGzip += gzipSize;
    }
  }
  if (extension === ".css") {
    totals.cssGzip += gzipSize;
    totals.documentAssetsGzip += gzipSize;
  }
}

const kib = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;
const failures = Object.entries(limits).filter(
  ([metric, limit]) => totals[metric] > limit,
);

console.log(
  [
    `JavaScript gzip: ${kib(totals.javascriptGzip)} / ${kib(limits.javascriptGzip)}`,
    `Initial JavaScript gzip: ${kib(totals.initialJavascriptGzip)} / ${kib(limits.initialJavascriptGzip)}`,
    `CSS gzip: ${kib(totals.cssGzip)} / ${kib(limits.cssGzip)}`,
    `Homepage + CSS + JS gzip: ${kib(totals.documentAssetsGzip)} / ${kib(limits.documentAssetsGzip)}`,
    `Largest HTML gzip: ${kib(totals.largestHtmlGzip)} / ${kib(limits.largestHtmlGzip)}`,
    `Total generated HTML: ${kib(totals.totalHtml)} / ${kib(limits.totalHtml)}`,
    `Largest image: ${kib(totals.largestImage)} / ${kib(limits.largestImage)} (${largestImageName})`,
    `Largest audio: ${kib(totals.largestAudio)} / ${kib(limits.largestAudio)} (${largestAudioName})`,
    `Total audio: ${kib(totals.totalAudio)} / ${kib(limits.totalAudio)}`,
  ].join("\n"),
);

if (failures.length) {
  console.error(
    `Performance budget exceeded: ${failures.map(([metric]) => metric).join(", ")}`,
  );
  process.exitCode = 1;
}
