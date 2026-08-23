import {
  isValidRoomCursor,
  MAX_ROOM_PARTICIPANTS,
  normalizeRoomForCreation,
  normalizeRoomParticipant,
  normalizeRoomSnapshot,
  ROOM_LIFETIME_MS,
} from "../domain/room";
import type { LearningRoom, RoomParticipant } from "../domain/types";
import { browserStorage, type KeyValueStorage } from "./storage";

const TEACHER_TOKEN_PREFIX = "linguaflow-teacher-token-";
const LOCAL_ROOM_PREFIX = "linguaflow-room-";
const PARTICIPANT_ID_PREFIX = "linguaflow-participant-id-";
const PARTICIPANT_TOKEN_PREFIX = "linguaflow-participant-token-";

export type RoomConnectionStatus =
  | "connecting"
  | "live"
  | "reconnecting"
  | "fallback";

export class RoomServiceError extends Error {
  constructor(
    message: string,
    readonly status = 0,
  ) {
    super(message);
  }
}

export interface RoomAdapter {
  readonly refreshIntervalMs: number;
  create(room: LearningRoom, teacherToken: string): Promise<LearningRoom>;
  get(code: string): Promise<LearningRoom>;
  join(code: string, participant: RoomParticipant, participantToken: string): Promise<LearningRoom>;
  subscribe(
    code: string,
    onRoom: (room: LearningRoom) => void,
    onStatus: (status: RoomConnectionStatus) => void,
    onEnded?: () => void,
  ): () => void;
  setQuestion(code: string, questionIndex: number, teacherToken: string): Promise<LearningRoom>;
  end(code: string, teacherToken: string): Promise<void>;
  leave(code: string, participantId: string, participantToken: string): Promise<void>;
}

interface StoredLocalRoom {
  room: LearningRoom;
  teacherToken: string;
  participantTokens: Record<string, string>;
  expiresAt: number;
}

async function roomRequest(
  path: string,
  init?: RequestInit,
): Promise<LearningRoom | null> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (response.status === 204) return null;
  const contentType = response.headers.get("Content-Type") ?? "";
  const body = contentType.includes("application/json")
    ? ((await response.json()) as { room?: unknown; error?: string })
    : null;
  if (!response.ok) {
    throw new RoomServiceError(
      body?.error ?? "The room service is temporarily unavailable.",
      response.status,
    );
  }
  const room = normalizeRoomSnapshot(body?.room);
  if (!room) {
    throw new RoomServiceError("The room service returned an invalid response.");
  }
  return room;
}

function validToken(token: string) {
  return token.length >= 32 && token.length <= 256;
}

export function createLocalRoomAdapter(
  storage: KeyValueStorage,
  now: () => number = Date.now,
): RoomAdapter {
  function key(code: string) {
    return `${LOCAL_ROOM_PREFIX}${code}`;
  }

  function read(code: string): StoredLocalRoom | null {
    const value = storage.get<StoredLocalRoom | LearningRoom | null>(key(code), null);
    if (!value) return null;
    const stored: StoredLocalRoom = "room" in value
      ? value
      : {
          room: value,
          teacherToken: storage.get(`${TEACHER_TOKEN_PREFIX}${code}`, ""),
          participantTokens: {},
          expiresAt: Date.parse(value.createdAt) + ROOM_LIFETIME_MS,
        };
    const room = normalizeRoomSnapshot(stored.room);
    if (!room || stored.expiresAt <= now()) {
      storage.remove(key(code));
      return null;
    }
    return { ...stored, room };
  }

  function required(code: string) {
    const stored = read(code);
    if (!stored) throw new RoomServiceError("Room not found or expired.", 404);
    return stored;
  }

  function save(code: string, stored: StoredLocalRoom) {
    storage.set(key(code), stored);
    return stored.room;
  }

  return {
    refreshIntervalMs: 1_500,
    async create(input, teacherToken) {
      const room = normalizeRoomForCreation(input);
      if (!room || !validToken(teacherToken)) {
        throw new RoomServiceError("Invalid room payload.", 400);
      }
      if (read(room.code)) throw new RoomServiceError("Room code already exists.", 409);
      return save(room.code, {
        room,
        teacherToken,
        participantTokens: {},
        expiresAt: now() + ROOM_LIFETIME_MS,
      });
    },
    async get(code) {
      return required(code).room;
    },
    async join(code, input, participantToken) {
      const stored = required(code);
      const participant = normalizeRoomParticipant(input);
      if (!participant || !validToken(participantToken)) {
        throw new RoomServiceError("A student name is required.", 400);
      }
      const existing = stored.room.participants.find((item) => item.id === participant.id);
      const existingToken = stored.participantTokens[participant.id];
      if (existing && existingToken && existingToken !== participantToken) {
        throw new RoomServiceError("Participant authorization required.", 403);
      }
      if (!existing && stored.room.participants.length >= MAX_ROOM_PARTICIPANTS) {
        throw new RoomServiceError("This room is full.", 409);
      }
      stored.room.participants = existing
        ? stored.room.participants.map((item) => item.id === participant.id ? participant : item)
        : [...stored.room.participants, participant];
      stored.participantTokens[participant.id] = participantToken;
      return save(code, stored);
    },
    subscribe(_code, _onRoom, onStatus) {
      onStatus("fallback");
      return () => undefined;
    },
    async setQuestion(code, questionIndex, teacherToken) {
      const stored = required(code);
      if (stored.teacherToken !== teacherToken) {
        throw new RoomServiceError("Teacher authorization required.", 403);
      }
      if (!isValidRoomCursor(stored.room, questionIndex)) {
        throw new RoomServiceError("Invalid question index.", 400);
      }
      stored.room.questionIndex = questionIndex;
      return save(code, stored);
    },
    async end(code, teacherToken) {
      const stored = required(code);
      if (stored.teacherToken !== teacherToken) {
        throw new RoomServiceError("Teacher authorization required.", 403);
      }
      storage.remove(key(code));
    },
    async leave(code, participantId, participantToken) {
      const stored = required(code);
      if (stored.participantTokens[participantId] !== participantToken) {
        throw new RoomServiceError("Participant authorization required.", 403);
      }
      stored.room.participants = stored.room.participants.filter((item) => item.id !== participantId);
      delete stored.participantTokens[participantId];
      save(code, stored);
    },
  };
}

export function createWorkerRoomAdapter(): RoomAdapter {
  return {
    refreshIntervalMs: 10_000,
    async create(room, teacherToken) {
      return (await roomRequest("/api/rooms", {
        method: "POST",
        body: JSON.stringify({ room, teacherToken }),
      }))!;
    },
    async get(code) {
      return (await roomRequest(`/api/rooms/${encodeURIComponent(code)}`))!;
    },
    async join(code, participant, participantToken) {
      return (await roomRequest(`/api/rooms/${encodeURIComponent(code)}/join`, {
        method: "POST",
        body: JSON.stringify({ participant, participantToken }),
      }))!;
    },
    subscribe(code, onRoom, onStatus, onEnded) {
      if (typeof WebSocket === "undefined" || typeof window === "undefined") {
        onStatus("fallback");
        return () => undefined;
      }
      let socket: WebSocket | null = null;
      let reconnectTimer = 0;
      let closed = false;
      let connected = false;

      const connect = () => {
        onStatus(connected ? "reconnecting" : "connecting");
        const url = new URL(`/api/rooms/${encodeURIComponent(code)}/live`, window.location.href);
        url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        socket = new WebSocket(url);
        socket.addEventListener("open", () => {
          connected = true;
          onStatus("live");
        });
        socket.addEventListener("message", (event) => {
          try {
            const message = JSON.parse(String(event.data)) as { type?: string; room?: unknown };
            const room = normalizeRoomSnapshot(message.room);
            if (message.type === "room" && room) onRoom(room);
            if (message.type === "ended") onEnded?.();
          } catch {
            // Keep the last trusted Room snapshot when a frame is malformed.
          }
        });
        socket.addEventListener("close", () => {
          if (closed) return;
          onStatus("reconnecting");
          reconnectTimer = window.setTimeout(connect, 1_500);
        });
        socket.addEventListener("error", () => socket?.close());
      };

      connect();
      return () => {
        closed = true;
        window.clearTimeout(reconnectTimer);
        socket?.close(1000, "Session view closed");
      };
    },
    async setQuestion(code, questionIndex, teacherToken) {
      return (await roomRequest(`/api/rooms/${encodeURIComponent(code)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${teacherToken}` },
        body: JSON.stringify({ questionIndex }),
      }))!;
    },
    async end(code, teacherToken) {
      await roomRequest(`/api/rooms/${encodeURIComponent(code)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
    },
    async leave(code, participantId, participantToken) {
      await roomRequest(`/api/rooms/${encodeURIComponent(code)}/participants/${encodeURIComponent(participantId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${participantToken}` },
      });
    },
  };
}

export function createRoomClient(adapter: RoomAdapter, storage: KeyValueStorage) {
  function teacherToken(code: string) {
    return storage.get<string | null>(`${TEACHER_TOKEN_PREFIX}${code}`, null);
  }

  function participantId(code: string) {
    const key = `${PARTICIPANT_ID_PREFIX}${code}`;
    const existing = storage.get<string | null>(key, null);
    if (existing) return existing;
    const created = crypto.randomUUID();
    storage.set(key, created);
    return created;
  }

  function participantToken(code: string) {
    const key = `${PARTICIPANT_TOKEN_PREFIX}${code}`;
    const existing = storage.get<string | null>(key, null);
    if (existing) return existing;
    const created = crypto.randomUUID();
    storage.set(key, created);
    return created;
  }

  return {
    async create(room: LearningRoom, token: string) {
      storage.set(`${TEACHER_TOKEN_PREFIX}${room.code}`, token);
      try {
        return await adapter.create(room, token);
      } catch (error) {
        storage.remove(`${TEACHER_TOKEN_PREFIX}${room.code}`);
        throw error;
      }
    },
    get: (code: string) => adapter.get(code),
    join: (code: string, participant: RoomParticipant) =>
      adapter.join(code, participant, participantToken(code)),
    participantId,
    subscribe(
      code: string,
      onRoom: (room: LearningRoom) => void,
      onStatus: (status: RoomConnectionStatus) => void,
      onEnded?: () => void,
    ) {
      const stopAdapter = adapter.subscribe(code, onRoom, onStatus, onEnded);
      const refresh = () => {
        if (typeof document === "undefined" || document.visibilityState === "visible") {
          void adapter.get(code).then(onRoom).catch((error) => {
            if (error instanceof RoomServiceError && error.status === 404) onEnded?.();
          });
        }
      };
      const interval = typeof window === "undefined"
        ? undefined
        : window.setInterval(refresh, adapter.refreshIntervalMs);
      return () => {
        stopAdapter();
        if (interval !== undefined) window.clearInterval(interval);
      };
    },
    async setQuestion(code: string, questionIndex: number) {
      const token = teacherToken(code);
      if (!token) throw new RoomServiceError("Teacher authorization is missing.", 403);
      return adapter.setQuestion(code, questionIndex, token);
    },
    async end(code: string) {
      const token = teacherToken(code);
      if (!token) throw new RoomServiceError("Teacher authorization is missing.", 403);
      await adapter.end(code, token);
      storage.remove(`${TEACHER_TOKEN_PREFIX}${code}`);
    },
    async leave(code: string) {
      const id = participantId(code);
      await adapter.leave(code, id, participantToken(code));
      storage.remove(`${PARTICIPANT_ID_PREFIX}${code}`);
      storage.remove(`${PARTICIPANT_TOKEN_PREFIX}${code}`);
    },
    canControl(code: string) {
      return Boolean(teacherToken(code));
    },
  };
}

const roomAdapter = import.meta.env.DEV
  ? createLocalRoomAdapter(browserStorage)
  : createWorkerRoomAdapter();

export const roomService = createRoomClient(roomAdapter, browserStorage);
