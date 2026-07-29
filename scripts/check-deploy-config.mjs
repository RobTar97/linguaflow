const value = process.env.PUBLIC_SITE_URL?.trim() ?? "";

let url;
try {
  url = new URL(value);
} catch {
  // The actionable message below covers missing and malformed values.
}

const valid =
  url?.protocol === "https:" &&
  url.username === "" &&
  url.password === "" &&
  url.search === "" &&
  url.hash === "" &&
  (url.pathname === "/" || url.pathname === "") &&
  ![".example", ".invalid", ".localhost", ".test"].some((suffix) =>
    url.hostname.endsWith(suffix),
  ) &&
  !["example.com", "example.net", "example.org"].some(
    (hostname) => url.hostname === hostname || url.hostname.endsWith(`.${hostname}`),
  ) &&
  !["localhost", "127.0.0.1"].includes(url.hostname);

if (!valid) {
  console.error(
    "PUBLIC_SITE_URL must be the final HTTPS production origin, with no path, query, fragment, credentials, localhost, or .example hostname.",
  );
  process.exit(1);
}

console.log(`Deployment SEO origin: ${url.origin}`);
