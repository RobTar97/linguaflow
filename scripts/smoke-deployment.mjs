import assert from "node:assert/strict";

const rawOrigin = process.argv[2] ?? process.env.PUBLIC_SITE_URL ?? "";
let origin;

try {
  const parsed = new URL(rawOrigin);
  const isLocalHttp =
    parsed.protocol === "http:" &&
    (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost");
  assert.ok(
    parsed.protocol === "https:" || isLocalHttp,
    "Deployment smoke tests require HTTPS except on localhost.",
  );
  assert.equal(parsed.pathname, "/", "Pass an origin without a path.");
  assert.equal(parsed.search, "", "Pass an origin without query parameters.");
  assert.equal(parsed.hash, "", "Pass an origin without a fragment.");
  origin = parsed.origin;
} catch (error) {
  console.error(
    "Usage: npm run smoke:deployment -- https://your-final-domain.example",
  );
  throw error;
}

async function request(path, expectedStatus = 200) {
  const response = await fetch(new URL(path, origin), {
    redirect: "manual",
    headers: { "User-Agent": "LinguaFlow deployment smoke test" },
  });
  assert.equal(
    response.status,
    expectedStatus,
    `${path} returned ${response.status}, expected ${expectedStatus}.`,
  );
  return { response, body: await response.text() };
}

function canonicalFrom(html) {
  const match = html.match(/<link rel="canonical" href="([^"]+)" \/>/i);
  assert.ok(match?.[1], "Page is missing its canonical link.");
  return new URL(match[1]);
}

const homepage = await request("/");
assert.match(homepage.body, /<h1>[^<]+<\/h1>/i, "Homepage needs one visible H1.");
assert.ok(
  !homepage.body.includes('type="module"'),
  "Public homepage must remain a static document.",
);
assert.ok(
  homepage.body.includes('type="application/ld+json"'),
  "Homepage schema is missing.",
);
assert.equal(canonicalFrom(homepage.body).href, `${origin}/`);

const app = await request("/app/");
assert.ok(
  app.body.includes('name="robots" content="noindex, follow"'),
  "Interactive workspace must remain noindexed.",
);
assert.ok(app.body.includes('type="module"'), "Workspace entry script is missing.");

for (const path of [
  "/en/topics/remote-work/",
  "/pl/topics/remote-work/",
  "/ja/topics/remote-work/",
  "/teachers/",
]) {
  const page = await request(path);
  const canonical = canonicalFrom(page.body);
  assert.equal(canonical.origin, origin, `${path} canonical uses the wrong origin.`);
  assert.equal(canonical.pathname, path, `${path} canonical uses the wrong path.`);
}

const sitemap = await request("/sitemap.xml");
assert.match(
  sitemap.response.headers.get("content-type") ?? "",
  /xml/i,
  "Sitemap must be served as XML.",
);
assert.ok(sitemap.body.includes(`${origin}/en/`), "Sitemap uses the wrong origin.");

const robots = await request("/robots.txt");
assert.ok(
  robots.body.split(/\r?\n/).some((line) => line.trim() === `Sitemap: ${origin}/sitemap.xml`),
  "robots.txt uses the wrong sitemap origin.",
);

await request("/llms.txt");
await request("/site.webmanifest");
await request("/icon-192.png");
await request("/icon-512.png");

const missing = await request("/deployment-smoke-missing-page/", 404);
assert.ok(
  missing.body.includes("Page not found"),
  "Unknown public routes must use the real 404 page.",
);

const apiRoot = await request("/api", 404);
assert.match(
  apiRoot.response.headers.get("x-robots-tag") ?? "",
  /noindex/i,
  "API responses must be noindexed.",
);
assert.match(
  apiRoot.response.headers.get("content-type") ?? "",
  /application\/json/i,
  "API errors must be JSON.",
);

const roomLink = await request("/app/?room=ABC-123");
assert.match(
  roomLink.response.headers.get("x-robots-tag") ?? "",
  /noindex/i,
  "Room links must carry an X-Robots-Tag noindex header.",
);

for (const [path, result] of [["/", homepage], ["/app/", app]]) {
  assert.ok(
    result.response.headers.has("content-security-policy"),
    `${path} is missing Content-Security-Policy.`,
  );
  assert.match(
    result.response.headers.get("strict-transport-security") ?? "",
    /max-age=/i,
    `${path} is missing HSTS.`,
  );
}

console.log(`Deployment smoke test passed for ${origin}`);
