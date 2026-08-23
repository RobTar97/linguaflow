import { describe, expect, it } from "vitest";
import { topicCatalog } from "../catalog/topicCatalog";
import {
  buildLearningRoom,
  isValidRoomCursor,
  normalizeRoomForCreation,
  normalizeRoomSnapshot,
} from "./room";

function room(mode: "shared-question" | "guided-training" = "shared-question") {
  return buildLearningRoom({
    code: "ABC-123",
    name: "  Tuesday practice  ",
    topic: topicCatalog.all()[0],
    teacherName: "  Ada  ",
    targetLanguage: "EN",
    supportLanguage: "PL",
    level: "B1",
    sessionMode: mode,
    createdAt: "2026-08-23T00:00:00.000Z",
  });
}

describe("Room contract", () => {
  it("constructs and normalizes a shared-question Room", () => {
    const normalized = normalizeRoomForCreation(room());
    expect(normalized).toMatchObject({
      code: "ABC-123",
      name: "Tuesday practice",
      teacherName: "Ada",
      sessionMode: "shared-question",
      questionIndex: 0,
      participants: [],
    });
  });

  it("enforces the version-1 guided cursor range and pause invariant", () => {
    const guided = room("guided-training");
    expect(isValidRoomCursor(guided, 0)).toBe(true);
    expect(isValidRoomCursor(guided, 1)).toBe(false);
    expect(isValidRoomCursor(guided, 3)).toBe(true);
    expect(isValidRoomCursor(guided, 14)).toBe(true);
    expect(isValidRoomCursor(guided, 15)).toBe(false);
  });

  it("rejects malformed Room state before persistence", () => {
    expect(normalizeRoomForCreation({ ...room(), code: "BAD" })).toBeNull();
    expect(normalizeRoomForCreation({ ...room(), supportLanguage: "EN" })).toBeNull();
    expect(normalizeRoomForCreation({ ...room("guided-training"), questionIndex: 20 })).toBeNull();
  });

  it("normalizes trusted snapshots without trusting participant data", () => {
    const snapshot = normalizeRoomSnapshot({
      ...room(),
      participants: [{ id: "12345678-1234-1234-1234-123456789abc", name: " Student ", status: "ready" }],
    });
    expect(snapshot?.participants[0].name).toBe("Student");
    expect(normalizeRoomSnapshot({ ...room(), participants: [{ id: "bad", name: "Student", status: "ready" }] })).toBeNull();
  });

  it("rejects a Topic that cannot support the selected direction", () => {
    expect(() => buildLearningRoom({
      code: "ABC-123",
      name: "Practice",
      topic: topicCatalog.all()[0],
      teacherName: "Ada",
      targetLanguage: "JA",
      supportLanguage: "PL",
      level: "B1",
      sessionMode: "shared-question",
    })).toThrow(/does not support/);
  });
});
