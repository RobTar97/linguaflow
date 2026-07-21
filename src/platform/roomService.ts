import type { LearningRoom, RoomParticipant } from "../domain/types";
import { browserStorage } from "./storage";

const TEACHER_TOKEN_PREFIX = "linguaflow-teacher-token-";
const LOCAL_ROOM_PREFIX = "linguaflow-room-";

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
      body: JSON.stringify({ participant }),
    }))!;
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

  canControl(code: string) {
    return Boolean(teacherToken(code));
  },
};
