import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { access, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = await findFreePort();
const origin = "http://127.0.0.1:" + port;
const stateDir = path.join(
  os.tmpdir(),
  "linguaflow-worker-test-" + process.pid + "-" + Date.now(),
);
const command = process.execPath;
const wranglerEntry = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const output = [];
const worker = spawn(
  command,
  [
    wranglerEntry,
    "dev",
    "--local",
    "--port",
    String(port),
    "--persist-to",
    stateDir,
    "--show-interactive-dev-session=false",
    "--log-level",
    "error",
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

worker.stdout.on("data", (chunk) => output.push(String(chunk)));
worker.stderr.on("data", (chunk) => output.push(String(chunk)));

try {
  await access(path.join(root, "dist", "index.html"));
  await waitForWorker();

  await expectStatus("/api", 404);
  const apiRoot = await request("/api");
  assert.match(apiRoot.response.headers.get("x-robots-tag") ?? "", /noindex/i);
  assert.match(
    apiRoot.response.headers.get("content-type") ?? "",
    /application\/json/i,
  );
  assert.equal((await parseJson(apiRoot)).error, "Not found.");

  const missing = await request("/worker-test-missing-page/");
  assert.equal(missing.response.status, 404);
  assert.match(missing.body, /Page not found/i);

  const app = await request("/app/");
  assert.equal(app.response.status, 200);
  assert.match(app.response.headers.get("x-robots-tag") ?? "", /noindex/i);
  const roomLink = await request("/app/?room=TST-101");
  assert.match(
    roomLink.response.headers.get("x-robots-tag") ?? "",
    /noindex/i,
  );
  assert.match(
    roomLink.response.headers.get("x-robots-tag") ?? "",
    /noarchive/i,
  );

  const unsupportedList = await request("/api/rooms");
  assert.equal(unsupportedList.response.status, 405);
  assert.equal(unsupportedList.response.headers.get("allow"), "POST");

  const unsupportedJoin = await request("/api/rooms/TST-101/join");
  assert.equal(unsupportedJoin.response.status, 405);
  assert.equal(unsupportedJoin.response.headers.get("allow"), "POST");

  const securityRoom = makeRoom("TST-101");
  const securityToken = token("teacher");
  const roomPayload = { room: securityRoom, teacherToken: securityToken };

  const missingOrigin = await jsonRequest("/api/rooms", "POST", roomPayload, {
    includeOrigin: false,
  });
  assert.equal(missingOrigin.response.status, 403);

  const crossOrigin = await jsonRequest("/api/rooms", "POST", roomPayload, {
    originHeader: "https://evil.example",
  });
  assert.equal(crossOrigin.response.status, 403);

  const wrongContentType = await request("/api/rooms", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "text/plain" },
    body: JSON.stringify(roomPayload),
  });
  assert.equal(wrongContentType.response.status, 415);

  const tooLarge = await request("/api/rooms", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: " ".repeat(32 * 1024 + 1),
  });
  assert.equal(tooLarge.response.status, 413);

  const guidedWithoutPlan = structuredClone(roomPayload);
  delete guidedWithoutPlan.room.trainingPlan;
  const rejectedGuidedWithoutPlan = await jsonRequest(
    "/api/rooms",
    "POST",
    guidedWithoutPlan,
  );
  assert.equal(rejectedGuidedWithoutPlan.response.status, 400);

  const sharedWithPlan = structuredClone(roomPayload);
  sharedWithPlan.room.sessionMode = "shared-question";
  const rejectedSharedWithPlan = await jsonRequest(
    "/api/rooms",
    "POST",
    sharedWithPlan,
  );
  assert.equal(rejectedSharedWithPlan.response.status, 400);

  const created = await jsonRequest("/api/rooms", "POST", roomPayload);
  assert.equal(created.response.status, 201);
  for (const header of [
    "cache-control",
    "cross-origin-resource-policy",
    "referrer-policy",
    "x-content-type-options",
    "x-frame-options",
    "x-robots-tag",
  ]) {
    assert.ok(created.response.headers.has(header), "missing " + header);
  }
  const createdBody = await parseJson(created);
  assert.equal(createdBody.room.name, "Room TST-101");
  assert.equal(createdBody.room.teacherName, "Teacher");
  assert.equal(createdBody.room.participants.length, 0);
  assert.equal(createdBody.room.sessionMode, "guided-training");
  assert.deepEqual(createdBody.room.trainingPlan, {
    mode: "guided-training",
    version: 1,
    stepCount: 8,
  });
  assert.equal("unexpected" in createdBody.room, false);
  assert.ok(createdBody.expiresAt > Date.now());

  const duplicate = await jsonRequest("/api/rooms", "POST", roomPayload);
  assert.equal(duplicate.response.status, 409);

  const fetched = await request("/api/rooms/TST-101");
  assert.equal(fetched.response.status, 200);
  assert.equal((await parseJson(fetched)).room.questionIndex, 0);

  const fallback = await request("/api/rooms/TST-101/live");
  assert.equal(fallback.response.status, 200);
  assert.equal((await parseJson(fallback)).room.code, "TST-101");

  const rejectedSocket = await websocketHandshake(
    "/api/rooms/TST-101/live",
    "https://evil.example",
  );
  assert.match(rejectedSocket, /^HTTP\/1\.1 403\b/);
  const acceptedSocket = await websocketHandshake(
    "/api/rooms/TST-101/live",
    origin,
  );
  assert.match(acceptedSocket, /^HTTP\/1\.1 101\b/);

  const participantId = "a".repeat(16);
  const participantToken = token("participant");
  const badParticipant = await jsonRequest(
    "/api/rooms/TST-101/join",
    "POST",
    {
      participant: { id: "not-a-valid-id", name: "Student", status: "ready" },
      participantToken,
    },
  );
  assert.equal(badParticipant.response.status, 400);

  const joined = await jsonRequest(
    "/api/rooms/TST-101/join",
    "POST",
    {
      participant: {
        id: participantId,
        name: "  Student  ",
        status: "ready",
      },
      participantToken,
    },
  );
  assert.equal(joined.response.status, 200);
  assert.equal((await parseJson(joined)).room.participants[0].name, "Student");

  const stolenParticipant = await jsonRequest(
    "/api/rooms/TST-101/join",
    "POST",
    {
      participant: { id: participantId, name: "Attacker", status: "ready" },
      participantToken: token("stolen"),
    },
  );
  assert.equal(stolenParticipant.response.status, 403);

  const missingTeacherAuth = await jsonRequest(
    "/api/rooms/TST-101",
    "PATCH",
    { questionIndex: 2 },
  );
  assert.equal(missingTeacherAuth.response.status, 403);

  const crossOriginPatch = await jsonRequest(
    "/api/rooms/TST-101",
    "PATCH",
    { questionIndex: 2 },
    {
      originHeader: "https://evil.example",
      authorization: "Bearer " + securityToken,
    },
  );
  assert.equal(crossOriginPatch.response.status, 403);

  const patched = await jsonRequest(
    "/api/rooms/TST-101",
    "PATCH",
    { questionIndex: 3 },
    { authorization: "Bearer " + securityToken },
  );
  assert.equal(patched.response.status, 200);
  assert.equal((await parseJson(patched)).room.questionIndex, 3);

  const wrongParticipantDelete = await request(
    "/api/rooms/TST-101/participants/" + participantId,
    {
      method: "DELETE",
      headers: {
        Origin: origin,
        Authorization: "Bearer " + token("stolen"),
      },
    },
  );
  assert.equal(wrongParticipantDelete.response.status, 403);

  const left = await request(
    "/api/rooms/TST-101/participants/" + participantId,
    {
      method: "DELETE",
      headers: {
        Origin: origin,
        Authorization: "Bearer " + participantToken,
      },
    },
  );
  assert.equal(left.response.status, 204);
  const afterLeave = await request("/api/rooms/TST-101");
  assert.equal((await parseJson(afterLeave)).room.participants.length, 0);

  const ended = await request("/api/rooms/TST-101", {
    method: "DELETE",
    headers: {
      Origin: origin,
      Authorization: "Bearer " + securityToken,
    },
  });
  assert.equal(ended.response.status, 204);
  assert.equal((await request("/api/rooms/TST-101")).response.status, 404);

  console.log(
    "Worker integration checks passed: status routing, static assets, security, room lifecycle, HTTP WebSocket fallback, and upgrade handling.",
  );
} finally {
  await stopWorker();
  if (stateDir.startsWith(os.tmpdir())) {
    try {
      await rm(stateDir, { recursive: true, force: true });
    } catch (error) {
      if (error?.code !== "EBUSY") throw error;
    }
  }
}

function token(prefix) {
  return prefix + "-" + randomBytes(24).toString("hex");
}

function makeRoom(code) {
  return {
    code,
    name: "  Room " + code + "  ",
    topicId: "remote-work",
    teacherName: "  Teacher  ",
    targetLanguage: "EN",
    supportLanguage: "PL",
    level: "B2",
    sessionMode: "guided-training",
    trainingPlan: { mode: "guided-training", version: 1, stepCount: 8 },
    questionIndex: 0,
    participants: [],
    createdAt: new Date().toISOString(),
    unexpected: "drop this field",
  };
}

async function request(pathname, options = {}) {
  const response = await fetch(new URL(pathname, origin), {
    redirect: "manual",
    ...options,
  });
  return { response, body: await response.text() };
}

async function jsonRequest(
  pathname,
  method,
  payload,
  { authorization, originHeader = origin, includeOrigin = true } = {},
) {
  const headers = { "Content-Type": "application/json" };
  if (includeOrigin) headers.Origin = originHeader;
  if (authorization) headers.Authorization = authorization;
  return request(pathname, {
    method,
    headers,
    body: JSON.stringify(payload),
  });
}

async function parseJson(result) {
  return JSON.parse(result.body);
}

async function expectStatus(pathname, status) {
  const result = await request(pathname);
  assert.equal(result.response.status, status, pathname + " status");
  return result;
}

async function waitForWorker() {
  const deadline = Date.now() + 60_000;
  let lastError;
  while (Date.now() < deadline) {
    if (worker.exitCode !== null) {
      throw new Error("Wrangler exited early.\n" + output.join(""));
    }
    try {
      const response = await fetch(origin + "/app/", { redirect: "manual" });
      if (response.status >= 200 && response.status < 500) return;
    } catch (error) {
      lastError = error;
    }
    await delay(250);
  }
  throw new Error(
    "Timed out waiting for Wrangler at " +
      origin +
      ": " +
      String(lastError) +
      "\n" +
      output.join(""),
  );
}

async function websocketHandshake(pathname, originHeader) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    const key = randomBytes(16).toString("base64");
    let response = "";
    let settled = false;
    const timeout = setTimeout(
      () => finish(new Error("WebSocket handshake timed out")),
      10_000,
    );

    function finish(error, value) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.destroy();
      if (error) reject(error);
      else resolve(value);
    }

    socket.on("connect", () => {
      socket.write(
        [
          "GET " + pathname + " HTTP/1.1",
          "Host: 127.0.0.1:" + port,
          "Connection: Upgrade",
          "Upgrade: websocket",
          "Origin: " + originHeader,
          "Sec-WebSocket-Version: 13",
          "Sec-WebSocket-Key: " + key,
          "",
          "",
        ].join("\r\n"),
      );
    });
    socket.on("data", (chunk) => {
      response += String(chunk);
      const headerEnd = response.indexOf("\r\n\r\n");
      if (headerEnd >= 0) finish(null, response.slice(0, headerEnd));
    });
    socket.on("error", (error) => finish(error));
    socket.on("close", () => {
      if (!settled) finish(new Error("WebSocket closed before handshake"));
    });
  });
}

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const selectedPort =
        typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(selectedPort));
    });
  });
}

async function stopWorker() {
  if (worker.exitCode !== null) return;
  worker.kill("SIGTERM");
  await Promise.race([
    onceExit(worker),
    delay(5_000).then(() => {
      worker.kill("SIGKILL");
    }),
  ]);
}

function onceExit(child) {
  return new Promise((resolve) => child.once("exit", resolve));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
