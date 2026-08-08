import type {
  GuidedTrainingPlan,
  LearningRoom,
  RoomParticipant,
} from "../src/domain/types";
import { DurableObject } from "cloudflare:workers";

interface Env {
  ASSETS: Fetcher;
  ROOMS: DurableObjectNamespace;
  RATE_LIMITER: DurableObjectNamespace;
}

interface StoredRoom {
  room: LearningRoom;
  teacherToken: string;
  participantTokens: Record<string, string>;
  expiresAt: number;
}

const ROOM_LIFETIME_MS = 8 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_TRAINING_STEPS = 8;
const VALID_LANGUAGES = new Set(["EN", "PL", "JA"]);
const VALID_LEVELS = new Set(["A1", "A2", "B1", "B2", "C1"]);
const ROOM_CODE_PATTERN = /^[A-Z]{3}-[0-9]{3}$/;
const PARTICIPANT_ID_PATTERN = /^[0-9a-f-]{16,80}$/;

type ApiRoute =
  | { kind: "api-root" }
  | { kind: "create" }
  | { kind: "room"; code: string }
  | { kind: "join"; code: string }
  | { kind: "live"; code: string }
  | { kind: "participant"; code: string; participantId: string }
  | { kind: "unknown" };

function json(value: unknown, status = 200, extraHeaders?: HeadersInit) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-Robots-Tag": "noindex",
      ...extraHeaders,
    },
  });
}

function methodNotAllowed(allow: string) {
  return json({ error: "Method not allowed." }, 405, { Allow: allow });
}

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function parseApiRoute(pathname: string): ApiRoute {
  if (pathname === "/api") return { kind: "api-root" };
  if (pathname === "/api/rooms") return { kind: "create" };

  const match = pathname.match(
    /^\/api\/rooms\/([A-Z]{3}-[0-9]{3})(?:\/(join|live|participants\/([0-9a-f-]{16,80})))?$/,
  );
  if (!match) return { kind: "unknown" };

  const code = match[1];
  const suffix = match[2];
  if (!suffix) return { kind: "room", code };
  if (suffix === "join") return { kind: "join", code };
  if (suffix === "live") return { kind: "live", code };

  const participantId = match[3];
  return participantId
    ? { kind: "participant", code, participantId }
    : { kind: "unknown" };
}

function methodsForRoute(route: ApiRoute) {
  switch (route.kind) {
    case "create":
      return ["POST"];
    case "room":
      return ["GET", "PATCH", "DELETE"];
    case "join":
      return ["POST"];
    case "live":
      return ["GET"];
    case "participant":
      return ["DELETE"];
    default:
      return [];
  }
}

function isGuidedTrainingPlan(value: unknown): value is GuidedTrainingPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Partial<GuidedTrainingPlan>;
  return (
    plan.mode === "guided-training" &&
    plan.version === 1 &&
    typeof plan.stepCount === "number" &&
    Number.isInteger(plan.stepCount) &&
    plan.stepCount >= 2 &&
    plan.stepCount <= MAX_TRAINING_STEPS
  );
}

function isRoom(value: unknown): value is LearningRoom {
  if (!value || typeof value !== "object") return false;
  const room = value as Partial<LearningRoom>;
  return (
    typeof room.code === "string" &&
    ROOM_CODE_PATTERN.test(room.code) &&
    typeof room.name === "string" &&
    room.name.trim().length >= 1 &&
    room.name.trim().length <= 80 &&
    typeof room.topicId === "string" &&
    /^[a-z0-9-]+(?::[a-z0-9-]+)?$/.test(room.topicId) &&
    room.topicId.length <= 121 &&
    (room.topicSnapshot === undefined || isTopicSnapshot(room.topicSnapshot)) &&
    typeof room.teacherName === "string" &&
    room.teacherName.trim().length >= 1 &&
    room.teacherName.trim().length <= 50 &&
    typeof room.targetLanguage === "string" &&
    VALID_LANGUAGES.has(room.targetLanguage) &&
    typeof room.supportLanguage === "string" &&
    VALID_LANGUAGES.has(room.supportLanguage) &&
    room.targetLanguage !== room.supportLanguage &&
    typeof room.level === "string" &&
    VALID_LEVELS.has(room.level) &&
    typeof room.questionIndex === "number" &&
    Number.isInteger(room.questionIndex) &&
    room.questionIndex >= 0 &&
    room.questionIndex <= 20 &&
    typeof room.createdAt === "string" &&
    Number.isFinite(Date.parse(room.createdAt)) &&
    Array.isArray(room.participants) &&
    ((room.sessionMode === undefined && room.trainingPlan === undefined) ||
      (room.sessionMode === "shared-question" &&
        room.trainingPlan === undefined) ||
      (room.sessionMode === "guided-training" &&
        isGuidedTrainingPlan(room.trainingPlan)))
  );
}

function isTopicSnapshot(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as LearningRoom["topicSnapshot"];
  if (!snapshot) return false;
  const strings = JSON.stringify(snapshot);
  return strings.length <= 32_000 &&
    typeof snapshot.id === "string" && snapshot.id.length <= 121 &&
    typeof snapshot.category === "string" &&
    snapshot.title && Object.values(snapshot.title).every((item) => typeof item === "string" && item.length <= 160) &&
    snapshot.mainPrompt && Object.values(snapshot.mainPrompt).every((item) => typeof item === "string" && item.length <= 500) &&
    snapshot.followUps && Object.values(snapshot.followUps).every((items) => Array.isArray(items) && items.length <= 12 && items.every((item) => typeof item === "string" && item.length <= 500)) &&
    snapshot.vocabulary && Object.values(snapshot.vocabulary).every((items) => Array.isArray(items) && items.length <= 12) &&
    snapshot.provenance && typeof snapshot.provenance.packId === "string" && snapshot.provenance.packId.length <= 60;
}

function cleanRoom(room: LearningRoom): LearningRoom {
  const cleaned: LearningRoom = {
    code: normalizeCode(room.code),
    name: room.name.trim(),
    topicId: room.topicId,
    ...(room.topicSnapshot ? { topicSnapshot: room.topicSnapshot } : {}),
    teacherName: room.teacherName.trim(),
    targetLanguage: room.targetLanguage,
    supportLanguage: room.supportLanguage,
    level: room.level,
    questionIndex: room.questionIndex,
    participants: [],
    createdAt: room.createdAt,
  };
  if (room.sessionMode) cleaned.sessionMode = room.sessionMode;
  if (room.trainingPlan && isGuidedTrainingPlan(room.trainingPlan)) {
    cleaned.trainingPlan = {
      mode: room.trainingPlan.mode,
      version: room.trainingPlan.version,
      stepCount: room.trainingPlan.stepCount,
    };
  }
  return cleaned;
}

async function bodyExceedsLimit(request: Request) {
  const body = request.clone().body;
  if (!body) return false;

  const reader = body.getReader();
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return false;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return true;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function validateRequestSecurity(
  request: Request,
  url: URL,
  route: ApiRoute,
) {
  const isWebSocket =
    route.kind === "live" &&
    request.method === "GET" &&
    request.headers.get("Upgrade")?.toLowerCase() === "websocket";
  const isMutation = request.method !== "GET" && request.method !== "HEAD";

  if (isWebSocket && request.headers.get("Origin") !== url.origin) {
    return json({ error: "Cross-origin requests are not allowed." }, 403);
  }

  if (!isMutation) return null;

  if (request.headers.get("Origin") !== url.origin) {
    return json({ error: "Cross-origin requests are not allowed." }, 403);
  }

  const contentLengthHeader = request.headers.get("Content-Length");
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
      return json({ error: "Invalid Content-Length header." }, 400);
    }
    if (contentLength > MAX_BODY_BYTES) {
      return json({ error: "Request body is too large." }, 413);
    }
  }

  if (request.method !== "DELETE") {
    const contentType = request.headers.get("Content-Type") ?? "";
    if (
      contentType.split(";", 1)[0].trim().toLowerCase() !==
      "application/json"
    ) {
      return json({ error: "JSON content type required." }, 415);
    }
  }

  if (await bodyExceedsLimit(request)) {
    return json({ error: "Request body is too large." }, 413);
  }

  return null;
}

function addHeaders(response: Response, headersToAdd: HeadersInit) {
  const headers = new Headers(response.headers);
  new Headers(headersToAdd).forEach((value, name) => {
    headers.set(name, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function fetchAsset(request: Request, env: Env, url: URL) {
  try {
    const response = await env.ASSETS.fetch(request);
    if (url.pathname !== "/app" && !url.pathname.startsWith("/app/")) {
      return response;
    }
    return addHeaders(response, {
      "X-Robots-Tag": url.searchParams.has("room")
        ? "noindex, noarchive"
        : "noindex, follow",
    });
  } catch {
    return json({ error: "Static assets are temporarily unavailable." }, 503, {
      "X-Robots-Tag": "noindex, noarchive",
    });
  }
}

function clientIdentity(request: Request) {
  return request.headers.get("CF-Connecting-IP")?.trim() || "anonymous";
}

async function clientKey(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest).slice(0, 12), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

interface RateBucket {
  count: number;
  resetAt: number;
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
}

function rateLimitError() {
  return json({ error: "The rate-limit service is temporarily unavailable." }, 503);
}

async function applyRateLimit(
  request: Request,
  env: Env,
  route: ApiRoute,
): Promise<Response | null> {
  const isCreate = route.kind === "create";
  const isMutation = request.method !== "GET" && request.method !== "HEAD";
  const rateBucket = isCreate ? "create" : isMutation ? "write" : "read";
  const rateLimit = isCreate ? 15 : isMutation ? 90 : 300;
  let rateResponse: Response;

  try {
    const limiter = env.RATE_LIMITER.getByName(
      await clientKey(clientIdentity(request)),
    );
    rateResponse = await limiter.fetch("https://internal/rate-limit", {
      method: "POST",
      headers: {
        "X-Rate-Bucket": rateBucket,
        "X-Rate-Limit": String(rateLimit),
        "X-Rate-Window": "60000",
      },
    });
  } catch {
    return rateLimitError();
  }

  if (!rateResponse.ok) return rateLimitError();
  const rate = (await rateResponse.json().catch(() => null)) as
    | RateLimitResult
    | null;
  if (!rate || typeof rate.allowed !== "boolean") return rateLimitError();
  if (!rate.allowed) {
    return json({ error: "Too many requests. Please try again shortly." }, 429, {
      "Retry-After": String(Math.max(1, rate.retryAfter || 1)),
    });
  }
  return null;
}

export class ApiRateLimiter extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return methodNotAllowed("POST");

    const bucket = request.headers.get("X-Rate-Bucket") ?? "default";
    const limit = positiveInteger(request.headers.get("X-Rate-Limit"), 60);
    const windowMs = positiveInteger(request.headers.get("X-Rate-Window"), 60_000);
    const now = Date.now();
    const stored = await this.ctx.storage.get<RateBucket>(bucket);
    const current =
      !stored || stored.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : stored;

    current.count += 1;
    await this.ctx.storage.put(bucket, current);
    const buckets = await this.ctx.storage.list<RateBucket>();
    const cleanupAt = Math.max(
      current.resetAt,
      ...Array.from(buckets.values(), (item) => item.resetAt),
    );
    await this.ctx.storage.setAlarm(cleanupAt);

    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return json({
      allowed: current.count <= limit,
      remaining: Math.max(0, limit - current.count),
      retryAfter,
    });
  }

  async alarm() {
    await this.ctx.storage.deleteAll();
  }
}

export class RoomCoordinator extends DurableObject<Env> {
  private broadcast(room: LearningRoom) {
    const message = JSON.stringify({ type: "room", room });
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(message);
      } catch {
        try {
          socket.close(1011, "Room update failed");
        } catch {
          // The peer may already be gone.
        }
      }
    }
  }

  private closeRoomSockets() {
    const message = JSON.stringify({ type: "ended" });
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(message);
      } catch {
        // Closing a failed socket is still attempted below.
      }
      try {
        socket.close(1000, "Room ended");
      } catch {
        // The peer may already be gone.
      }
    }
  }

  private async clearStoredRoom() {
    this.closeRoomSockets();
    await this.ctx.storage.deleteAll();
  }

  private async storedRoom() {
    const stored = await this.ctx.storage.get<StoredRoom>("room");
    if (!stored) return null;
    if (stored.expiresAt <= Date.now()) {
      await this.clearStoredRoom();
      return null;
    }
    return stored;
  }

  private authorized(request: Request, stored: StoredRoom) {
    const authorization = request.headers.get("Authorization");
    return authorization === "Bearer " + stored.teacherToken;
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (message !== "ping") return;
    try {
      ws.send("pong");
    } catch {
      try {
        ws.close(1011, "WebSocket response failed");
      } catch {
        // The peer may already be gone.
      }
    }
  }

  webSocketClose() {
    // Hibernation callbacks are intentionally no-op: room state is in storage.
  }

  webSocketError(ws: WebSocket) {
    try {
      ws.close(1011, "WebSocket error");
    } catch {
      // The peer may already be gone.
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const route = parseApiRoute(url.pathname);

    if (route.kind === "api-root" || route.kind === "unknown") {
      return json({ error: "Not found." }, 404);
    }

    const allowedMethods = methodsForRoute(route);
    if (!allowedMethods.includes(request.method)) {
      return methodNotAllowed(allowedMethods.join(", "));
    }

    if (route.kind === "create") {
      const body = (await request.json().catch(() => null)) as {
        room?: unknown;
        teacherToken?: unknown;
      } | null;
      if (
        !isRoom(body?.room) ||
        typeof body?.teacherToken !== "string" ||
        body.teacherToken.length < 32 ||
        body.teacherToken.length > 256
      ) {
        return json({ error: "Invalid room payload." }, 400);
      }
      if (normalizeCode(body.room.code) !== body.room.code) {
        return json({ error: "Invalid room code." }, 400);
      }
      if (await this.storedRoom()) {
        return json({ error: "Room code already exists." }, 409);
      }
      const expiresAt = Date.now() + ROOM_LIFETIME_MS;
      const stored: StoredRoom = {
        room: cleanRoom(body.room),
        teacherToken: body.teacherToken,
        participantTokens: {},
        expiresAt,
      };
      await this.ctx.storage.put("room", stored);
      await this.ctx.storage.setAlarm(expiresAt);
      return json({ room: stored.room, expiresAt }, 201);
    }

    const stored = await this.storedRoom();
    if (!stored) return json({ error: "Room not found or expired." }, 404);

    if (
      route.kind === "live" &&
      request.headers.get("Upgrade")?.toLowerCase() === "websocket"
    ) {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server, [stored.room.code]);
      server.send(JSON.stringify({ type: "room", room: stored.room }));
      return new Response(null, { status: 101, webSocket: client });
    }

    if (
      (route.kind === "room" || route.kind === "live") &&
      request.method === "GET"
    ) {
      return json({ room: stored.room, expiresAt: stored.expiresAt });
    }

    if (route.kind === "join") {
      const body = (await request.json().catch(() => null)) as {
        participant?: RoomParticipant;
        participantToken?: unknown;
      } | null;
      const participant = body?.participant;
      if (
        !participant ||
        typeof participant.id !== "string" ||
        !PARTICIPANT_ID_PATTERN.test(participant.id) ||
        typeof participant.name !== "string" ||
        !participant.name.trim() ||
        participant.name.trim().length > 50 ||
        !["ready", "speaking", "listening"].includes(participant.status) ||
        typeof body?.participantToken !== "string" ||
        body.participantToken.length < 32 ||
        body.participantToken.length > 256
      ) {
        return json({ error: "A student name is required." }, 400);
      }
      const cleanParticipant: RoomParticipant = {
        id: participant.id,
        name: participant.name.trim(),
        status: participant.status,
      };
      const existing = stored.room.participants.find(
        (item) => item.id === cleanParticipant.id,
      );
      const existingToken = stored.participantTokens?.[cleanParticipant.id];
      if (existing && existingToken && existingToken !== body.participantToken) {
        return json({ error: "Participant authorization required." }, 403);
      }
      if (!existing && stored.room.participants.length >= 50) {
        return json({ error: "This room is full." }, 409);
      }
      stored.room.participants = existing
        ? stored.room.participants.map((item) =>
            item.id === cleanParticipant.id ? cleanParticipant : item,
          )
        : [...stored.room.participants, cleanParticipant];
      stored.participantTokens ??= {};
      stored.participantTokens[cleanParticipant.id] = body.participantToken;
      await this.ctx.storage.put("room", stored);
      this.broadcast(stored.room);
      return json({ room: stored.room });
    }

    if (route.kind === "room" && request.method === "PATCH") {
      if (!this.authorized(request, stored)) {
        return json({ error: "Teacher authorization required." }, 403);
      }
      const body = (await request.json().catch(() => null)) as {
        questionIndex?: unknown;
      } | null;
      if (
        typeof body?.questionIndex !== "number" ||
        !Number.isInteger(body.questionIndex) ||
        body.questionIndex < 0 ||
        body.questionIndex > 20
      ) {
        return json({ error: "Invalid question index." }, 400);
      }
      stored.room.questionIndex = body.questionIndex;
      await this.ctx.storage.put("room", stored);
      this.broadcast(stored.room);
      return json({ room: stored.room });
    }

    if (route.kind === "participant") {
      const authorization = request.headers.get("Authorization");
      const participantToken = stored.participantTokens?.[route.participantId];
      if (
        !participantToken ||
        authorization !== "Bearer " + participantToken
      ) {
        return json({ error: "Participant authorization required." }, 403);
      }
      const nextParticipants = stored.room.participants.filter(
        (participant) => participant.id !== route.participantId,
      );
      if (nextParticipants.length !== stored.room.participants.length) {
        stored.room.participants = nextParticipants;
        delete stored.participantTokens[route.participantId];
        await this.ctx.storage.put("room", stored);
        this.broadcast(stored.room);
      }
      return new Response(null, { status: 204 });
    }

    if (route.kind === "room" && request.method === "DELETE") {
      if (!this.authorized(request, stored)) {
        return json({ error: "Teacher authorization required." }, 403);
      }
      await this.clearStoredRoom();
      return new Response(null, { status: 204 });
    }

    return methodNotAllowed(allowedMethods.join(", "));
  }

  async alarm() {
    const stored = await this.ctx.storage.get<StoredRoom>("room");
    if (stored && stored.expiresAt > Date.now()) {
      await this.ctx.storage.setAlarm(stored.expiresAt);
      return;
    }
    await this.clearStoredRoom();
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const route = parseApiRoute(url.pathname);

    if (route.kind === "api-root") {
      return json({ error: "Not found." }, 404);
    }
    if (route.kind === "unknown") {
      return url.pathname.startsWith("/api/")
        ? json({ error: "Not found." }, 404)
        : fetchAsset(request, env, url);
    }

    const securityError = await validateRequestSecurity(request, url, route);
    if (securityError) return securityError;

    const allowedMethods = methodsForRoute(route);
    if (!allowedMethods.includes(request.method)) {
      return methodNotAllowed(allowedMethods.join(", "));
    }

    const rateLimitErrorResponse = await applyRateLimit(request, env, route);
    if (rateLimitErrorResponse) return rateLimitErrorResponse;

    let code = "";
    if (route.kind === "create") {
      const body = (await request.clone().json().catch(() => null)) as {
        room?: { code?: unknown };
      } | null;
      if (typeof body?.room?.code === "string") code = body.room.code;
    } else if ("code" in route) {
      code = route.code;
    }

    code = normalizeCode(code);
    if (!ROOM_CODE_PATTERN.test(code)) {
      return json({ error: "Invalid room code." }, 400);
    }

    try {
      const stub = env.ROOMS.getByName(code);
      return await stub.fetch(request);
    } catch {
      return json({ error: "The room service is temporarily unavailable." }, 503);
    }
  },
} satisfies ExportedHandler<Env>;
