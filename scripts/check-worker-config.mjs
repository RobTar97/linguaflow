import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(
  await readFile(path.join(root, "wrangler.jsonc"), "utf8"),
);

assert.equal(config.name, "linguaflow");
assert.equal(config.main, "worker/index.ts");
assert.match(config.compatibility_date, /^\d{4}-\d{2}-\d{2}$/);
assert.ok(
  Date.parse(config.compatibility_date + "T00:00:00Z") <= Date.now(),
  "compatibility_date must not be in the future",
);

assert.equal(config.assets.directory, "./dist");
assert.equal(config.assets.binding, "ASSETS");
assert.equal(config.assets.html_handling, "force-trailing-slash");
assert.equal(config.assets.not_found_handling, "404-page");
for (const pattern of ["/app/*", "/api", "/api/*"]) {
  assert.ok(
    config.assets.run_worker_first.includes(pattern),
    "assets.run_worker_first is missing " + pattern,
  );
}

assert.equal(config.observability.enabled, true);
assert.equal(config.observability.head_sampling_rate, 0.1);
assert.equal(config.env.staging.name, "linguaflow-staging");
assert.equal(config.env.staging.observability.enabled, true);
assert.equal(config.env.staging.observability.head_sampling_rate, 1);

const expectedBindings = [
  { name: "ROOMS", class_name: "RoomCoordinator" },
  { name: "RATE_LIMITER", class_name: "ApiRateLimiter" },
];
assert.deepEqual(config.durable_objects.bindings, expectedBindings);
assert.deepEqual(config.env.staging.durable_objects.bindings, expectedBindings);
assert.ok(
  config.env.staging.durable_objects.bindings.every(
    (binding) => !("script_name" in binding),
  ),
  "staging bindings must resolve to the isolated linguaflow-staging Worker",
);

const expectedMigrations = [
  { tag: "v1", new_sqlite_classes: ["RoomCoordinator"] },
  { tag: "v2", new_sqlite_classes: ["ApiRateLimiter"] },
];
assert.deepEqual(config.migrations, expectedMigrations);
assert.deepEqual(config.env.staging.migrations, expectedMigrations);

console.log(
  "Worker config check passed: production + isolated staging bindings, assets, migrations, and observability.",
);
