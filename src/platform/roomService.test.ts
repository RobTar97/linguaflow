import { describe, expect, it } from "vitest";
import { topicCatalog } from "../catalog/topicCatalog";
import { buildLearningRoom } from "../domain/room";
import type { KeyValueStorage } from "./storage";
import { createLocalRoomAdapter, RoomServiceError } from "./roomService";

function memoryStorage(): KeyValueStorage {
  const values = new Map<string, unknown>();
  return {
    get: (key, fallback) => values.has(key) ? values.get(key) as typeof fallback : fallback,
    set: (key, value) => { values.set(key, value); },
    remove: (key) => { values.delete(key); },
  };
}

function room(mode: "shared-question" | "guided-training" = "shared-question") {
  return buildLearningRoom({
    code: "ABC-123",
    name: "Practice",
    topic: topicCatalog.all()[0],
    teacherName: "Ada",
    targetLanguage: "EN",
    supportLanguage: "PL",
    level: "B1",
    sessionMode: mode,
    createdAt: "2026-08-23T00:00:00.000Z",
  });
}

const teacherToken = "t".repeat(32);
const participantToken = "p".repeat(32);

describe("local Room adapter", () => {
  it("runs an authorized Room lifecycle", async () => {
    const adapter = createLocalRoomAdapter(memoryStorage(), () => Date.parse("2026-08-23T01:00:00.000Z"));
    await adapter.create(room(), teacherToken);
    await adapter.join("ABC-123", { id: "12345678-1234-1234-1234-123456789abc", name: " Student ", status: "ready" }, participantToken);
    expect((await adapter.get("ABC-123")).participants[0].name).toBe("Student");
    await adapter.setQuestion("ABC-123", 2, teacherToken);
    expect((await adapter.get("ABC-123")).questionIndex).toBe(2);
    await adapter.leave("ABC-123", "12345678-1234-1234-1234-123456789abc", participantToken);
    expect((await adapter.get("ABC-123")).participants).toEqual([]);
    await adapter.end("ABC-123", teacherToken);
    await expect(adapter.get("ABC-123")).rejects.toMatchObject({ status: 404 });
  });

  it("matches guided cursor and authorization rules", async () => {
    const adapter = createLocalRoomAdapter(memoryStorage(), () => Date.parse("2026-08-23T01:00:00.000Z"));
    await adapter.create(room("guided-training"), teacherToken);
    await expect(adapter.setQuestion("ABC-123", 1, teacherToken)).rejects.toBeInstanceOf(RoomServiceError);
    await expect(adapter.setQuestion("ABC-123", 3, "wrong".repeat(7))).rejects.toMatchObject({ status: 403 });
  });

  it("expires Rooms after eight hours", async () => {
    let now = Date.parse("2026-08-23T01:00:00.000Z");
    const adapter = createLocalRoomAdapter(memoryStorage(), () => now);
    await adapter.create(room(), teacherToken);
    now += ROOM_LIFETIME_MS_FOR_TEST;
    await expect(adapter.get("ABC-123")).rejects.toMatchObject({ status: 404 });
  });
});

const ROOM_LIFETIME_MS_FOR_TEST = 8 * 60 * 60 * 1000;
