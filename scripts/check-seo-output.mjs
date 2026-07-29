import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const DIST_DIR = fileURLToPath(new URL("../dist/", import.meta.url));
const REPOSITORY_URL = "https://github.com/RobTar97/linguaflow";
const expectedBaseUrl = (
  process.env.PUBLIC_SITE_URL || "https://linguaflow.example"
).replace(/\/+$/, "");
const failures = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    }),
  );
  return nested.flat();
}

function match(html, pattern) {
  return html.match(pattern)?.[1]?.trim() ?? "";
}

function textContent(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const files = await walk(DIST_DIR);
const htmlFiles = files.filter((file) => extname(file) === ".html");
const indexPages = htmlFiles.filter((file) => file.endsWith("index.html"));
const indexablePages = indexPages.filter(
  (file) => relative(DIST_DIR, file).replaceAll("\\", "/") !== "app/index.html",
);
const topicPages = indexPages.filter((file) =>
  /[\\/](en|pl|ja)[\\/]topics[\\/][a-z0-9-]+[\\/]index\.html$/.test(file),
);
const canonicals = new Set();

if (indexPages.length !== 152) {
  failures.push(`Expected 152 HTML entry pages, found ${indexPages.length}.`);
}
if (indexablePages.length !== 151) {
  failures.push(`Expected 151 indexable HTML pages, found ${indexablePages.length}.`);
}
if (topicPages.length !== 144) {
  failures.push(`Expected 144 localized topic pages, found ${topicPages.length}.`);
}

for (const file of indexablePages) {
  const html = await readFile(file, "utf8");
  const name = relative(DIST_DIR, file);
  const title = match(html, /<title>([\s\S]*?)<\/title>/i);
  const description = match(
    html,
    /<meta\s+name="description"\s+content="([^"]+)"/i,
  );
  const canonical = match(
    html,
    /<link\s+rel="canonical"\s+href="([^"]+)"/i,
  );
  const headings = html.match(/<h1(?:\s[^>]*)?>/gi)?.length ?? 0;
  const schemaText = match(
    html,
    /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i,
  );

  if (!title || title.length > 70) {
    failures.push(`${name}: title must contain 1–70 characters.`);
  }
  if (!description || description.length > 160) {
    failures.push(`${name}: meta description must contain 1–160 characters.`);
  }
  if (!canonical.startsWith(`${expectedBaseUrl}/`)) {
    failures.push(`${name}: canonical must use ${expectedBaseUrl}.`);
  }
  if (canonicals.has(canonical)) {
    failures.push(`${name}: duplicate canonical ${canonical}.`);
  }
  canonicals.add(canonical);
  if (headings !== 1) failures.push(`${name}: expected exactly one h1.`);
  if (!/<meta\s+name="robots"\s+content="index, follow/i.test(html)) {
    failures.push(`${name}: missing index/follow robots directive.`);
  }
  if (!schemaText) {
    failures.push(`${name}: missing JSON-LD.`);
  } else {
    try {
      const schema = JSON.parse(schemaText);
      if (schema["@context"] !== "https://schema.org") {
        failures.push(`${name}: JSON-LD must use https://schema.org.`);
      }
    } catch {
      failures.push(`${name}: JSON-LD is not valid JSON.`);
    }
  }
  if (html.includes("__PUBLIC_SITE_URL__") || html.includes("__HOMEPAGE_SCHEMA__")) {
    failures.push(`${name}: unresolved SEO placeholder.`);
  }
}

const homepage = await readFile(join(DIST_DIR, "index.html"), "utf8");
const homepageMain = match(homepage, /<main[^>]*>([\s\S]*?)<\/main\s*>/i);
if (!homepageMain) {
  failures.push("Homepage is missing its public main content.");
}
const homepageWords = textContent(homepageMain).split(/\s+/).filter(Boolean).length;
if (homepageWords < 500) {
  failures.push(`Homepage contains ${homepageWords} visible words; expected at least 500.`);
}

const workspace = await readFile(join(DIST_DIR, "app", "index.html"), "utf8");
if (!workspace.includes('name="robots" content="noindex, follow"')) {
  failures.push("Interactive workspace must be noindex, follow.");
}
if (!/<script[^>]+src="\/assets\/[^"]+\.js"/.test(workspace)) {
  failures.push("Interactive workspace is missing its application entry script.");
}

for (const file of topicPages) {
  const html = await readFile(file, "utf8");
  const name = relative(DIST_DIR, file);
  for (const code of ["en", "pl", "ja", "x-default"]) {
    if (!html.includes(`hreflang="${code}"`)) {
      failures.push(`${name}: missing ${code} hreflang.`);
    }
  }
  if (!html.includes('"@type":"LearningResource"')) {
    failures.push(`${name}: missing LearningResource schema.`);
  }
  if (!html.includes('"@type":"BreadcrumbList"')) {
    failures.push(`${name}: missing BreadcrumbList schema.`);
  }
}

const sitemap = await readFile(join(DIST_DIR, "sitemap.xml"), "utf8");
const sitemapUrls = sitemap.match(/<url>/g)?.length ?? 0;
if (sitemapUrls !== 151) {
  failures.push(`Sitemap contains ${sitemapUrls} URLs; expected 151.`);
}
if (
  sitemap.includes("<priority>") ||
  sitemap.includes("<changefreq>") ||
  /<loc>[^<]*\?/.test(sitemap)
) {
  failures.push("Sitemap contains deprecated fields or parameterized URLs.");
}
if (!sitemap.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"')) {
  failures.push("Sitemap is missing the hreflang XHTML namespace.");
}

const robots = await readFile(join(DIST_DIR, "robots.txt"), "utf8");
if (!robots.includes(`Sitemap: ${expectedBaseUrl}/sitemap.xml`)) {
  failures.push("robots.txt does not reference the canonical sitemap.");
}
if (!robots.includes("Disallow: /api/")) {
  failures.push("robots.txt does not exclude API routes.");
}

const llms = await readFile(join(DIST_DIR, "llms.txt"), "utf8");
const markdownLinks = [...llms.matchAll(/\]\((https:\/\/[^)\s]+)\)/g)].map(
  ([, value]) => new URL(value),
);
const hasRepositoryLink = markdownLinks.some(
  (url) =>
    url.protocol === "https:" &&
    url.hostname === "github.com" &&
    url.pathname.replace(/\/$/, "") === "/RobTar97/linguaflow",
);
if (!llms.includes("# LinguaFlow") || !hasRepositoryLink) {
  failures.push("llms.txt is missing the project identity or source link.");
}

console.log(
  [
    `Indexable SEO pages: ${indexablePages.length}`,
    `Noindexed app entries: ${indexPages.length - indexablePages.length}`,
    `Localized topic pages: ${topicPages.length}`,
    `Sitemap URLs: ${sitemapUrls}`,
    `Unique canonicals: ${canonicals.size}`,
    `Homepage visible words: ${homepageWords}`,
  ].join("\n"),
);

if (failures.length) {
  console.error(`SEO output check failed:\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
}
