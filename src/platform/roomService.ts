import type { LearningRoom, RoomParticipant } from "../domain/types";
import { browserStorage } from "./storage";

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
    ? ((await response.json()) as { room?: LearningRoom; error?: string })
    : null;
  if (!response.ok) {
    throw new RoomServiceError(
      body?.error ?? "The room service is temporarily unavailable.",
      response.status,
    );
  }
  if (!body?.room) {
    throw new RoomServiceError("The room service returned an invalid response.");
  }
  return body.room;
}

function localRoom(code: string) {
  return browserStorage.get<LearningRoom | null>(`${LOCAL_ROOM_PREFIX}${code}`, null);
}

function saveLocalRoom(room: LearningRoom) {
  browserStorage.set(`${LOCAL_ROOM_PREFIX}${room.code}`, room);
  return room;
}

function teacherToken(code: string) {
  return browserStorage.get<string | null>(`${TEACHER_TOKEN_PREFIX}${code}`, null);
}

function participantId(code: string) {
  const key = `${PARTICIPANT_ID_PREFIX}${code}`;
  const existing = browserStorage.get<string | null>(key, null);
  if (existing) return existing;
  const created = crypto.randomUUID();
  browserStorage.set(key, created);
  return created;
}

function participantToken(code: string) {
  const key = `${PARTICIPANT_TOKEN_PREFIX}${code}`;
  const existing = browserStorage.get<string | null>(key, null);
  if (existing) return existing;
  const created = crypto.randomUUID();
  browserStorage.set(key, created);
  return created;
}

export const roomService = {
  async create(room: LearningRoom, token: string) {
    browserStorage.set(`${TEACHER_TOKEN_PREFIX}${room.code}`, token);
    if (import.meta.env.DEV) return saveLocalRoom(room);
    try {
      return (await roomRequest("/api/rooms", {
        method: "POST",
        body: JSON.stringify({ room, teacherToken: token }),
      }))!;
    } catch (error) {
      browserStorage.remove(`${TEACHER_TOKEN_PREFIX}${room.code}`);
      throw error;
    }
  },

  async get(code: string) {
    if (import.meta.env.DEV) {
      const room = localRoom(code);
      if (!room) throw new RoomServiceError("Room not found or expired.", 404);
      return room;
    }
    return (await roomRequest(`/api/rooms/${encodeURIComponent(code)}`))!;
  },

  async join(code: string, participant: RoomParticipant) {
    if (import.meta.env.DEV) {
      const room = await this.get(code);
      return saveLocalRoom({
        ...room,
        participants: room.participants.some((item) => item.id === participant.id)
          ? room.participants.map((item) =>
              item.id === participant.id ? participant : item,
            )
          : [...room.participants, participant],
      });
    }
    return (await roomRequest(`/api/rooms/${encodeURIComponent(code)}/join`, {
      method: "POST",
      body: JSON.stringify({
        participant,
        participantToken: participantToken(code),
      }),
    }))!;
  },

  participantId,

  subscribe(
    code: string,
    onRoom: (room: LearningRoom) => void,
    onStatus: (status: RoomConnectionStatus) => void,
    onEnded?: () => void,
  ) {
    if (import.meta.env.DEV || typeof WebSocket === "undefined") {
      onStatus("fallback");
      return () => undefined;
    }

    let socket: WebSocket | null = null;
    let reconnectTimer = 0;
    let closed = false;

    const connect = () => {
      onStatus(socket ? "reconnecting" : "connecting");
      const url = new URL(
        `/api/rooms/${encodeURIComponent(code)}/live`,
        window.location.href,
      );
      url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(url);
      socket.addEventListener("open", () => onStatus("live"));
      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(String(event.data)) as {
            type?: string;
            room?: LearningRoom;
          };
          if (message.type === "room" && message.room) onRoom(message.room);
          if (message.type === "ended") onEnded?.();
        } catch {
          // Ignore malformed frames and keep the last trusted room snapshot.
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

  async setQuestion(code: string, questionIndex: number) {
    const token = teacherToken(code);
    if (!token) throw new RoomServiceError("Teacher authorization is missing.", 403);
    if (import.meta.env.DEV) {
      const room = await this.get(code);
      return saveLocalRoom({ ...room, questionIndex: Math.max(0, questionIndex) });
    }
    return (await roomRequest(`/api/rooms/${encodeURIComponent(code)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ questionIndex }),
    }))!;
  },

  async end(code: string) {
    const token = teacherToken(code);
    if (import.meta.env.DEV) {
      browserStorage.remove(`${LOCAL_ROOM_PREFIX}${code}`);
    } else if (token) {
      await roomRequest(`/api/rooms/${encodeURIComponent(code)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    browserStorage.remove(`${TEACHER_TOKEN_PREFIX}${code}`);
  },

  async leave(code: string) {
    const id = participantId(code);
    if (import.meta.env.DEV) {
      const room = await this.get(code);
      saveLocalRoom({
        ...room,
        participants: room.participants.filter((item) => item.id !== id),
      });
    } else {
      const token = participantToken(code);
      await roomRequest(
        `/api/rooms/${encodeURIComponent(code)}/participants/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    }
    browserStorage.remove(`${PARTICIPANT_ID_PREFIX}${code}`);
    browserStorage.remove(`${PARTICIPANT_TOKEN_PREFIX}${code}`);
  },

  canControl(code: string) {
    return Boolean(teacherToken(code));
  },
};
