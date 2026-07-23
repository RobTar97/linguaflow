import type { LearningRoom, RoomParticipant } from "../src/domain/types";
import { DurableObject } from "cloudflare:workers";

interface Env {
  ASSETS: Fetcher;
  ROOMS: DurableObjectNamespace;
  RATE_LIMITER: DurableObjectNamespace;
}

interface StoredRoom {
  room: LearningRoom;
  teacherToken: string;
  expiresAt: number;
}

const ROOM_LIFETIME_MS = 8 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 32 * 1024;
const VALID_LANGUAGES = new Set(["EN", "PL", "JA"]);
const VALID_LEVELS = new Set(["A1", "A2", "B1", "B2", "C1"]);

function json(value: unknown, status = 200, extraHeaders?: HeadersInit) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
      ...extraHeaders,
    },
  });
}

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function isRoom(value: unknown): value is LearningRoom {
  if (!value || typeof value !== "object") return false;
  const room = value as Partial<LearningRoom>;
  return (
    typeof room.code === "string" &&
    /^[A-Z]{3}-[0-9]{3}$/.test(room.code) &&
    typeof room.name === "string" &&
    room.name.trim().length >= 1 &&
    room.name.trim().length <= 80 &&
    typeof room.topicId === "string" &&
    /^[a-z0-9-]{1,80}$/.test(room.topicId) &&
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
    Array.isArray(room.participants)
  );
}

function cleanRoom(room: LearningRoom): LearningRoom {
  return {
    ...room,
    code: normalizeCode(room.code),
    name: room.name.trim(),
    teacherName: room.teacherName.trim(),
    participants: [],
  };
}

interface RateBucket {
  count: number;
  resetAt: number;
}

export class ApiRateLimiter extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

    const bucket = request.headers.get("X-Rate-Bucket") ?? "default";
    const limit = Number(request.headers.get("X-Rate-Limit") ?? 60);
    const windowMs = Number(request.headers.get("X-Rate-Window") ?? 60_000);
    const now = Date.now();
    const stored = await this.ctx.storage.get<RateBucket>(bucket);
    const current =
      !stored || stored.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : stored;

    current.count += 1;
    await this.ctx.storage.put(bucket, current);
    await this.ctx.storage.setAlarm(current.resetAt);

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
  private async storedRoom() {
    const stored = await this.ctx.storage.get<StoredRoom>("room");
    if (!stored) return null;
    if (stored.expiresAt <= Date.now()) {
      await this.ctx.storage.deleteAll();
      return null;
    }
    return stored;
  }

  private authorized(request: Request, stored: StoredRoom) {
    const authorization = request.headers.get("Authorization");
    return authorization === `Bearer ${stored.teacherToken}`;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const isCreate = request.method === "POST" && url.pathname === "/api/rooms";

    if (isCreate) {
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
        expiresAt,
      };
      await this.ctx.storage.put("room", stored);
      await this.ctx.storage.setAlarm(expiresAt);
      return json({ room: stored.room, expiresAt }, 201);
    }

    const stored = await this.storedRoom();
    if (!stored) return json({ error: "Room not found or expired." }, 404);

    if (request.method === "GET") {
      return json({ room: stored.room, expiresAt: stored.expiresAt });
    }

    if (request.method === "POST" && url.pathname.endsWith("/join")) {
      const body = (await request.json().catch(() => null)) as {
        participant?: RoomParticipant;
      } | null;
      const participant = body?.participant;
      if (
        !participant ||
        typeof participant.id !== "string" ||
        participant.id.length < 16 ||
        participant.id.length > 80 ||
        typeof participant.name !== "string" ||
        !participant.name.trim() ||
        participant.name.trim().length > 50 ||
        !["ready", "speaking", "listening"].includes(participant.status)
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
      if (!existing && stored.room.participants.length >= 50) {
        return json({ error: "This room is full." }, 409);
      }
      stored.room.participants = existing
        ? stored.room.participants.map((item) =>
            item.id === cleanParticipant.id ? cleanParticipant : item,
          )
        : [...stored.room.participants, cleanParticipant];
      await this.ctx.storage.put("room", stored);
      return json({ room: stored.room });
    }

    if (request.method === "PATCH") {
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
      return json({ room: stored.room });
    }

    if (request.method === "DELETE") {
      if (!this.authorized(request, stored)) {
        return json({ error: "Teacher authorization required." }, 403);
      }
      await this.ctx.storage.deleteAll();
      return new Response(null, { status: 204 });
    }

    return json({ error: "Method not allowed." }, 405, {
      Allow: "GET, POST, PATCH, DELETE",
    });
  }

  async alarm() {
    await this.ctx.storage.deleteAll();
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    if (
      url.pathname !== "/api/rooms" &&
      !/^\/api\/rooms\/[A-Z]{3}-[0-9]{3}(?:\/join)?$/.test(url.pathname)
    ) {
      return json({ error: "Not found." }, 404);
    }

    const isMutation = request.method !== "GET" && request.method !== "HEAD";
    if (isMutation) {
      const origin = request.headers.get("Origin");
      if (origin !== url.origin) {
        return json({ error: "Cross-origin requests are not allowed." }, 403);
      }
      const contentLength = Number(request.headers.get("Content-Length") ?? 0);
      if (contentLength > MAX_BODY_BYTES) {
        return json({ error: "Request body is too large." }, 413);
      }
      if (
        request.method !== "DELETE" &&
        !request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")
      ) {
        return json({ error: "JSON content type required." }, 415);
      }
      if (request.method !== "DELETE") {
        const bodyText = await request.clone().text();
        if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
          return json({ error: "Request body is too large." }, 413);
        }
      }
    }

    const clientAddress =
      request.headers.get("CF-Connecting-IP") ??
      request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
      "local";
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(clientAddress),
    );
    const clientKey = Array.from(new Uint8Array(digest).slice(0, 12), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    const isCreate = request.method === "POST" && url.pathname === "/api/rooms";
    const rateBucket = isCreate ? "create" : isMutation ? "write" : "read";
    const rateLimit = isCreate ? 15 : isMutation ? 90 : 300;
    const limiter = env.RATE_LIMITER.getByName(clientKey);
    const rateResponse = await limiter.fetch("https://internal/rate-limit", {
      method: "POST",
      headers: {
        "X-Rate-Bucket": rateBucket,
        "X-Rate-Limit": String(rateLimit),
        "X-Rate-Window": "60000",
      },
    });
    const rate = (await rateResponse.json()) as {
      allowed: boolean;
      retryAfter: number;
    };
    if (!rate.allowed) {
      return json({ error: "Too many requests. Please try again shortly." }, 429, {
        "Retry-After": String(rate.retryAfter),
      });
    }

    let code = "";
    if (isCreate) {
      const body = (await request.clone().json().catch(() => null)) as {
        room?: { code?: unknown };
      } | null;
      if (typeof body?.room?.code === "string") code = body.room.code;
    } else {
      code = url.pathname.split("/")[3] ?? "";
    }

    code = normalizeCode(code);
    if (!/^[A-Z]{3}-[0-9]{3}$/.test(code)) {
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
