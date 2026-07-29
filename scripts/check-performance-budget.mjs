import { gzipSync } from "node:zlib";
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const DIST_DIR = fileURLToPath(new URL("../dist/", import.meta.url));
const limits = {
  javascriptGzip: 170 * 1024,
  cssGzip: 12 * 1024,
  documentAssetsGzip: 200 * 1024,
  largestImage: 600 * 1024,
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
const totals = {
  javascriptGzip: 0,
  cssGzip: 0,
  documentAssetsGzip: 0,
  largestImage: 0,
};
let largestImageName = "";

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
  if (![".html", ".css", ".js"].includes(extension)) continue;

  const gzipSize = gzipSync(await readFile(file)).byteLength;
  totals.documentAssetsGzip += gzipSize;
  if (extension === ".js") totals.javascriptGzip += gzipSize;
  if (extension === ".css") totals.cssGzip += gzipSize;
}

const kib = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;
const failures = Object.entries(limits).filter(
  ([metric, limit]) => totals[metric] > limit,
);

console.log(
  [
    `JavaScript gzip: ${kib(totals.javascriptGzip)} / ${kib(limits.javascriptGzip)}`,
    `CSS gzip: ${kib(totals.cssGzip)} / ${kib(limits.cssGzip)}`,
    `HTML + CSS + JS gzip: ${kib(totals.documentAssetsGzip)} / ${kib(limits.documentAssetsGzip)}`,
    `Largest image: ${kib(totals.largestImage)} / ${kib(limits.largestImage)} (${largestImageName})`,
  ].join("\n"),
);

if (failures.length) {
  console.error(
    `Performance budget exceeded: ${failures.map(([metric]) => metric).join(", ")}`,
  );
  process.exitCode = 1;
}
