import type {
  GuidedTrainingPlan,
  LearningRoom,
  RoomSessionMode,
} from "./types";

export const GUIDED_TRAINING_PLAN: GuidedTrainingPlan = {
  mode: "guided-training",
  version: 1,
  stepCount: 8,
};

const CURSOR_STRIDE = 2;

export type GuidedTrainingStepKind =
  | "welcome"
  | "warm-up"
  | "practice"
  | "reflect"
  | "complete";

export type GuidedTrainingStatus =
  | "lobby"
  | "active"
  | "paused"
  | "complete";

export interface GuidedTrainingStep {
  index: number;
  kind: GuidedTrainingStepKind;
  questionIndex: number | null;
}

export interface GuidedTrainingView {
  status: GuidedTrainingStatus;
  stepIndex: number;
  stepCount: number;
  step: GuidedTrainingStep;
  paused: boolean;
  progress: number;
  questionIndex: number | null;
}

export function isGuidedTrainingMode(
  mode: RoomSessionMode | undefined,
): mode is "guided-training" {
  return mode === "guided-training";
}

export function isGuidedTrainingRoom(room: LearningRoom): boolean {
  return isGuidedTrainingMode(room.sessionMode);
}

export function trainingPlanForRoom(room: LearningRoom): GuidedTrainingPlan {
  if (
    room.trainingPlan?.mode === "guided-training" &&
    room.trainingPlan.version === 1 &&
    Number.isInteger(room.trainingPlan.stepCount) &&
    room.trainingPlan.stepCount >= 2 &&
    room.trainingPlan.stepCount <= GUIDED_TRAINING_PLAN.stepCount
  ) {
    return room.trainingPlan;
  }
  return GUIDED_TRAINING_PLAN;
}

export function guidedTrainingStep(
  stepIndex: number,
  stepCount = GUIDED_TRAINING_PLAN.stepCount,
): GuidedTrainingStep {
  const safeIndex = clampStepIndex(stepIndex, stepCount);
  const isWelcome = safeIndex === 0;
  const isComplete = safeIndex === stepCount - 1;
  const questionIndex = isWelcome || isComplete ? null : safeIndex - 1;
  const kind: GuidedTrainingStepKind = isWelcome
    ? "welcome"
    : isComplete
      ? "complete"
      : safeIndex === 1
        ? "warm-up"
        : safeIndex === stepCount - 2
          ? "reflect"
          : "practice";

  return { index: safeIndex, kind, questionIndex };
}

/**
 * Encodes the guided step and its pause state into the existing room cursor.
 * The Worker already validates this field as an integer from 0 through 20.
 */
export function encodeTrainingCursor(
  stepIndex: number,
  paused = false,
  stepCount = GUIDED_TRAINING_PLAN.stepCount,
): number {
  const step = guidedTrainingStep(stepIndex, stepCount);
  const canPause = step.kind !== "welcome" && step.kind !== "complete";
  return step.index * CURSOR_STRIDE + (paused && canPause ? 1 : 0);
}

export function decodeTrainingCursor(
  cursor: number,
  stepCount = GUIDED_TRAINING_PLAN.stepCount,
): GuidedTrainingView {
  const safeCursor = clampCursor(cursor, stepCount);
  const stepIndex = Math.floor(safeCursor / CURSOR_STRIDE);
  const paused = safeCursor % CURSOR_STRIDE === 1;
  const step = guidedTrainingStep(stepIndex, stepCount);
  const status: GuidedTrainingStatus =
    step.kind === "welcome"
      ? "lobby"
      : step.kind === "complete"
        ? "complete"
        : paused
          ? "paused"
          : "active";

  return {
    status,
    stepIndex,
    stepCount,
    step,
    paused: status === "paused",
    progress: stepIndex / Math.max(1, stepCount - 1),
    questionIndex: step.questionIndex,
  };
}

export function guidedTrainingView(room: LearningRoom): GuidedTrainingView | null {
  if (!isGuidedTrainingRoom(room)) return null;
  const plan = trainingPlanForRoom(room);
  return decodeTrainingCursor(room.questionIndex, plan.stepCount);
}

export function nextTrainingCursor(view: GuidedTrainingView): number {
  if (view.status === "paused") {
    return encodeTrainingCursor(view.stepIndex, false, view.stepCount);
  }
  return encodeTrainingCursor(view.stepIndex + 1, false, view.stepCount);
}

export function previousTrainingCursor(view: GuidedTrainingView): number {
  return encodeTrainingCursor(Math.max(0, view.stepIndex - 1), false, view.stepCount);
}

function clampStepIndex(stepIndex: number, stepCount: number): number {
  return Math.min(Math.max(Math.trunc(stepIndex), 0), Math.max(1, stepCount - 1));
}

function clampCursor(cursor: number, stepCount: number): number {
  const maxCursor = Math.max(0, (Math.max(2, stepCount) - 1) * CURSOR_STRIDE);
  return Math.min(Math.max(Math.trunc(cursor), 0), maxCursor);
}
