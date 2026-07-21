import type { LearningRoom, RoomParticipant } from "../src/domain/types";
import { DurableObject } from "cloudflare:workers";

interface Env {
  ASSETS: Fetcher;
  ROOMS: DurableObjectNamespace;
}

interface StoredRoom {
  room: LearningRoom;
  teacherToken: string;
  expiresAt: number;
}

const ROOM_LIFETIME_MS = 8 * 60 * 60 * 1000;

function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
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
    typeof room.name === "string" &&
    typeof room.topicId === "string" &&
    typeof room.teacherName === "string" &&
    typeof room.questionIndex === "number" &&
    Array.isArray(room.participants)
  );
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
      if (!isRoom(body?.room) || typeof body?.teacherToken !== "string") {
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
        room: { ...body.room, participants: [] },
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
        typeof participant.name !== "string" ||
        !participant.name.trim()
      ) {
        return json({ error: "A student name is required." }, 400);
      }
      const existing = stored.room.participants.find(
        (item) => item.id === participant.id,
      );
      if (!existing && stored.room.participants.length >= 50) {
        return json({ error: "This room is full." }, 409);
      }
      stored.room.participants = existing
        ? stored.room.participants.map((item) =>
            item.id === participant.id ? participant : item,
          )
        : [...stored.room.participants, participant];
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
        !Number.isInteger(body.questionIndex)
      ) {
        return json({ error: "Invalid question index." }, 400);
      }
      stored.room.questionIndex = Math.max(0, body.questionIndex);
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

    return json({ error: "Method not allowed." }, 405);
  }

  async alarm() {
    await this.ctx.storage.deleteAll();
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/rooms")) {
      return env.ASSETS.fetch(request);
    }

    let code = "";
    if (request.method === "POST" && url.pathname === "/api/rooms") {
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

    const stub = env.ROOMS.getByName(code);
    return stub.fetch(request);
  },
} satisfies ExportedHandler<Env>;
