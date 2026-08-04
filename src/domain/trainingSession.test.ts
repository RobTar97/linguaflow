import { describe, expect, it } from "vitest";
import {
  GUIDED_TRAINING_PLAN,
  decodeTrainingCursor,
  encodeTrainingCursor,
  guidedTrainingView,
  nextTrainingCursor,
  previousTrainingCursor,
} from "./trainingSession";
import type { LearningRoom } from "./types";

function guidedRoom(questionIndex = 0): LearningRoom {
  return {
    code: "ABC-123",
    name: "Guided practice",
    topicId: "remote-work",
    teacherName: "Teacher",
    targetLanguage: "EN",
    supportLanguage: "PL",
    level: "B1",
    sessionMode: "guided-training",
    trainingPlan: GUIDED_TRAINING_PLAN,
    questionIndex,
    participants: [],
    createdAt: "2026-08-04T00:00:00.000Z",
  };
}

describe("guided training cursor", () => {
  it("models the full lobby, active, paused, reflection, and complete lifecycle", () => {
    expect(decodeTrainingCursor(0)).toMatchObject({
      status: "lobby",
      stepIndex: 0,
      questionIndex: null,
    });
    expect(decodeTrainingCursor(encodeTrainingCursor(1))).toMatchObject({
      status: "active",
      stepIndex: 1,
      questionIndex: 0,
    });
    expect(decodeTrainingCursor(encodeTrainingCursor(2, true))).toMatchObject({
      status: "paused",
      stepIndex: 2,
      questionIndex: 1,
      paused: true,
    });
    expect(decodeTrainingCursor(encodeTrainingCursor(6))).toMatchObject({
      status: "active",
      stepIndex: 6,
      questionIndex: 5,
    });
    expect(decodeTrainingCursor(encodeTrainingCursor(7))).toMatchObject({
      status: "complete",
      stepIndex: 7,
      questionIndex: null,
    });
  });

  it("advances a paused step by resuming it and supports teacher backtracking", () => {
    const paused = decodeTrainingCursor(encodeTrainingCursor(3, true));
    expect(nextTrainingCursor(paused)).toBe(encodeTrainingCursor(3));
    expect(previousTrainingCursor(paused)).toBe(encodeTrainingCursor(2));
  });

  it("clamps corrupt wire cursors to the plan bounds", () => {
    expect(decodeTrainingCursor(999)).toMatchObject({
      status: "complete",
      stepIndex: GUIDED_TRAINING_PLAN.stepCount - 1,
    });
    expect(decodeTrainingCursor(-2)).toMatchObject({
      status: "lobby",
      stepIndex: 0,
    });
  });

  it("reads the guided plan from the existing room snapshot contract", () => {
    expect(guidedTrainingView(guidedRoom(encodeTrainingCursor(4)))).toMatchObject({
      status: "active",
      stepIndex: 4,
      questionIndex: 3,
    });
    expect(guidedTrainingView({ ...guidedRoom(), sessionMode: "shared-question" })).toBeNull();
  });
});
