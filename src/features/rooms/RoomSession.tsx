import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  Link2,
  LogOut,
  MessageCircle,
  Pause,
  Radio,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { topicCatalog } from "../../catalog/topicCatalog";
import { categoryCopy } from "../../content/topics";
import {
  encodeTrainingCursor,
  guidedTrainingView,
  nextTrainingCursor,
  previousTrainingCursor,
  type GuidedTrainingStepKind,
} from "../../domain/trainingSession";
import { workspaceCopy, type WorkspaceCopy } from "../../i18n/workspaceCopy";
import { motionEaseInOut, questionVariants } from "../../motion/presets";
import { buildJoinUrl } from "../../platform/shareLinks";
import { roomService, type RoomConnectionStatus } from "../../platform/roomService";
import { soundEffects } from "../../platform/soundEffects";
import { WorkspaceHeader } from "../../ui/WorkspaceHeader";
import { useLearningWorkspace } from "../../workspace/context";

export default function RoomSession({ mode }: { mode: "teacher" | "student" }) {
  const {
    profile,
    activeRoom,
    updateRoomQuestion,
    refreshRoom,
    leaveRoom,
  } = useLearningWorkspace();
  const reduceMotion = useReducedMotion();
  const copy = workspaceCopy[profile!.goal.interfaceLocale];
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [controlError, setControlError] = useState("");
  const [connectionStatus, setConnectionStatus] =
    useState<RoomConnectionStatus>("connecting");
  const refreshRoomRef = useRef(refreshRoom);
  const lastSoundedQuestionRef = useRef({
    code: activeRoom?.code,
    index: activeRoom?.questionIndex,
  });
  const roomCode = activeRoom?.code;

  useEffect(() => {
    refreshRoomRef.current = refreshRoom;
  }, [refreshRoom]);

  useEffect(() => {
    const currentCode = activeRoom?.code;
    const currentIndex = activeRoom?.questionIndex;
    const previous = lastSoundedQuestionRef.current;
    if (!currentCode || currentIndex === undefined) return;
    if (previous.code === currentCode && previous.index !== currentIndex) {
      soundEffects.play("question-step");
    }
    lastSoundedQuestionRef.current = {
      code: currentCode,
      index: currentIndex,
    };
  }, [activeRoom?.code, activeRoom?.questionIndex]);

  useEffect(() => {
    if (!roomCode) return;
    const stop = roomService.subscribe(
      roomCode,
      (room) => void refreshRoomRef.current(room),
      setConnectionStatus,
      () => void refreshRoomRef.current(),
    );
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshRoomRef.current();
      }
    }, import.meta.env.DEV ? 1_500 : 10_000);
    return () => {
      stop();
      window.clearInterval(interval);
    };
  }, [roomCode]);

  if (!activeRoom) return null;
  const topic = topicCatalog.get(activeRoom.topicId)!;
  const questions = [
    topic.mainPrompt[activeRoom.targetLanguage],
    ...topic.followUps[activeRoom.targetLanguage],
  ];
  const supportQuestions = [
    topic.mainPrompt[activeRoom.supportLanguage],
    ...topic.followUps[activeRoom.supportLanguage],
  ];
  const guided = guidedTrainingView(activeRoom);
  const sharedQuestionIndex = Math.min(
    activeRoom.questionIndex,
    questions.length - 1,
  );
  const questionIndex = guided?.questionIndex ?? sharedQuestionIndex;
  const isLast = guided
    ? guided.status === "complete"
    : sharedQuestionIndex === questions.length - 1;
  const question = questionIndex === null ? null : questions[questionIndex];
  const supportQuestion =
    questionIndex === null ? null : supportQuestions[questionIndex];
  const displayedQuestion = guided
    ? guided.status === "active" || guided.status === "paused"
      ? question
      : null
    : question;
  const displayedSupportQuestion = guided
    ? guided.status === "active" || guided.status === "paused"
      ? supportQuestion
      : null
    : supportQuestion;
  const phaseLabel = guided
    ? trainingPhaseLabel(guided.step.kind, copy)
    : copy.currentQuestion;
  const sessionLabel = guided
    ? copy.guidedTrainingLabel
    : copy.sharedQuestionLabel;

  async function moveQuestion(index: number) {
    setControlError("");
    try {
      await updateRoomQuestion(index);
    } catch {
      setControlError(copy.roomServiceError);
    }
  }

  async function moveTrainingCursor(cursor: number) {
    await moveQuestion(cursor);
  }

  async function handleTrainingAdvance() {
    if (!guided) return;
    if (guided.status === "lobby") {
      await moveTrainingCursor(encodeTrainingCursor(1, false, guided.stepCount));
      return;
    }
    if (guided.status === "paused") {
      await moveTrainingCursor(encodeTrainingCursor(guided.stepIndex, false, guided.stepCount));
      return;
    }
    await moveTrainingCursor(nextTrainingCursor(guided));
  }

  async function handleTrainingPause() {
    if (!guided || guided.status === "complete" || guided.status === "lobby") {
      return;
    }
    await moveTrainingCursor(encodeTrainingCursor(guided.stepIndex, !guided.paused, guided.stepCount));
  }

  async function handleLeave() {
    setControlError("");
    try {
      await leaveRoom(mode === "teacher");
    } catch {
      setControlError(copy.roomServiceError);
    }
  }

  async function copyCode() {
    await navigator.clipboard?.writeText(activeRoom!.code);
    soundEffects.play("action-success");
    setCopied("code");
    window.setTimeout(() => setCopied(null), 1200);
  }

  async function copyInviteLink() {
    await navigator.clipboard?.writeText(buildJoinUrl(activeRoom!.code));
    soundEffects.play("action-success");
    setCopied("link");
    window.setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div className="workspace-page">
      <WorkspaceHeader />
      <main className="room-session-page">
        <header className="room-session-header">
          <div>
            <p className="eyebrow">
              <Radio size={15} />
              {mode === "teacher" ? copy.liveSync : copy.waitingTeacher}
              <span
                className={`sync-state is-${connectionStatus}`}
                role="status"
              >
                {connectionStatus === "live"
                  ? copy.syncedLive
                  : connectionStatus === "fallback"
                    ? copy.syncFallback
                    : copy.syncReconnecting}
              </span>
            </p>
            <h1>{activeRoom.name}</h1>
            <p>
              {activeRoom.supportLanguage} →{" "}
              <strong>{activeRoom.targetLanguage}</strong> · {activeRoom.level}
              <span className="session-mode-badge">{sessionLabel}</span>
            </p>
          </div>
          <div className="room-code-card">
            <span>{copy.roomCode}</span>
            <strong>{activeRoom.code}</strong>
            <div>
              <button type="button" onClick={copyInviteLink}>
                {copied === "link" ? <Check size={17} /> : <Link2 size={17} />}
                {copied === "link" ? copy.inviteCopied : copy.copyInviteLink}
              </button>
              <button type="button" onClick={copyCode}>
                {copied === "code" ? <Check size={17} /> : <Clipboard size={17} />}
                {copied === "code" ? copy.copied : copy.copyCode}
              </button>
            </div>
          </div>
        </header>

        <div className="room-session-layout">
          <section className="presentation-board">
            <div className="presentation-topic">
              <span>{categoryCopy[topic.category][profile!.goal.interfaceLocale]}</span>
              <strong>{topic.title[profile!.goal.interfaceLocale]}</strong>
              <small>
                {guided
                  ? `${copy.trainingStep} ${guided.stepIndex + 1} ${copy.trainingOf} ${guided.stepCount}`
                  : `${sharedQuestionIndex + 1}/${questions.length}`}
              </small>
            </div>
            {guided ? (
              <div className="training-phase-list" aria-label={copy.sessionMode}>
                {(["warm-up", "practice", "reflect", "complete"] as const).map(
                  (kind) => (
                    <span
                      className={
                        guided.step.kind === kind
                          ? "is-current"
                          : guided.stepIndex > trainingPhaseEnd(kind, guided.stepCount)
                            ? "is-done"
                            : ""
                      }
                      key={kind}
                    >
                      {trainingPhaseLabel(kind, copy)}
                    </span>
                  ),
                )}
              </div>
            ) : null}
            <div
              className="presentation-progress"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={guided?.stepCount ?? questions.length}
              aria-valuenow={(guided?.stepIndex ?? sharedQuestionIndex) + 1}
              aria-label={
                guided
                  ? `${copy.trainingStep} ${guided.stepIndex + 1} ${copy.trainingOf} ${guided.stepCount}`
                  : copy.currentQuestion
              }
            >
              <motion.span
                style={{ transformOrigin: "left center" }}
                animate={{
                  transform: `scaleX(${guided?.progress ?? (sharedQuestionIndex + 1) / questions.length})`,
                }}
                transition={{
                  duration: reduceMotion ? 0 : 0.24,
                  ease: motionEaseInOut,
                }}
              />
            </div>
            <div className="presentation-question">
              <span>
                <MessageCircle size={18} />
                {phaseLabel}
              </span>
              <AnimatePresence mode="sync">
                <motion.p
                  key={`${activeRoom.questionIndex}-${guided?.status ?? "shared"}`}
                  variants={questionVariants(Boolean(reduceMotion))}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {displayedQuestion ??
                    (guided?.status === "complete"
                      ? copy.trainingComplete
                      : copy.trainingLobby)}
                </motion.p>
              </AnimatePresence>
              {guided ? (
                <p className="training-state-hint">
                  {guided.status === "lobby"
                    ? copy.trainingLobbyHint
                    : guided.status === "paused"
                      ? copy.trainingPausedHint
                      : guided.status === "complete"
                        ? copy.trainingCompleteHint
                        : copy.trainingActiveHint}
                </p>
              ) : null}
              {displayedSupportQuestion ? (
                <details>
                  <summary>{copy.supportTranslation}</summary>
                  <p>{displayedSupportQuestion}</p>
                </details>
              ) : null}
            </div>
            {guided ? (
              <div className={`training-support-card is-${guided.status}`} role="status">
                <span className="training-support-icon">
                  {guided.status === "complete" ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Sparkles size={18} />
                  )}
                </span>
                <div>
                  <strong>
                    {guided.status === "paused"
                      ? copy.trainingPaused
                      : copy.trainingSupport}
                  </strong>
                  <p>{copy.trainingSupportHint}</p>
                </div>
              </div>
            ) : null}
            <div className="presentation-vocabulary">
              {topic.vocabulary[activeRoom.targetLanguage].slice(0, 6).map((item) => (
                <span key={item.word}>
                  <strong>{item.word}</strong>
                  {item.translation}
                </span>
              ))}
            </div>
            {mode === "teacher" ? (
              guided ? (
                <div className="presentation-controls is-guided">
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={guided.stepIndex === 0}
                    onClick={() =>
                      void moveTrainingCursor(previousTrainingCursor(guided))
                    }
                  >
                    <ArrowLeft size={18} />
                    {copy.trainingPrevious}
                  </button>
                  {guided.status === "active" ? (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => void handleTrainingPause()}
                    >
                      <Pause size={18} />
                      {copy.trainingPause}
                    </button>
                  ) : null}
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() =>
                      guided.status === "complete"
                        ? void moveTrainingCursor(encodeTrainingCursor(0, false, guided.stepCount))
                        : void handleTrainingAdvance()
                    }
                  >
                    {guided.status === "complete"
                      ? copy.trainingRestart
                      : guided.status === "lobby"
                        ? copy.trainingStart
                        : guided.status === "paused"
                          ? copy.trainingResume
                          : guided.stepIndex === guided.stepCount - 2
                            ? copy.trainingFinish
                            : copy.trainingNext}
                    {guided.status === "complete" ? (
                      <RotateCcw size={18} />
                    ) : (
                      <ArrowRight size={18} />
                    )}
                  </button>
                </div>
              ) : (
                <div className="presentation-controls">
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={sharedQuestionIndex === 0}
                    onClick={() => void moveQuestion(sharedQuestionIndex - 1)}
                  >
                    <ArrowLeft size={18} />
                    {copy.previous}
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={isLast}
                    onClick={() => void moveQuestion(sharedQuestionIndex + 1)}
                  >
                    {copy.nextQuestion}
                    <ArrowRight size={18} />
                  </button>
                </div>
              )
            ) : null}
            {controlError ? <p className="form-error" role="alert">{controlError}</p> : null}
          </section>

          <aside className="participant-panel">
            <div className="participant-heading">
              <span>
                <Users size={18} />
                {copy.participants}
              </span>
              <strong>{activeRoom.participants.length}</strong>
            </div>
            {activeRoom.participants.length ? (
              <ul>
                {activeRoom.participants.map((participant) => (
                  <li key={participant.id}>
                    <span>{participant.name.slice(0, 1).toUpperCase()}</span>
                    <strong>{participant.name}</strong>
                    <small>{participant.status}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="participant-empty">{copy.noParticipants}</p>
            )}
            <button
              className="secondary-button"
              type="button"
              onClick={() => void handleLeave()}
            >
              <LogOut size={17} />
              {mode === "teacher" ? copy.endRoom : copy.leaveRoom}
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}

function trainingPhaseLabel(
  kind: GuidedTrainingStepKind,
  copy: WorkspaceCopy,
): string {
  switch (kind) {
    case "welcome":
      return copy.trainingLobby;
    case "warm-up":
      return copy.trainingWarmUp;
    case "practice":
      return copy.trainingPractice;
    case "reflect":
      return copy.trainingReflect;
    case "complete":
      return copy.trainingComplete;
  }
}

function trainingPhaseEnd(
  kind: Exclude<GuidedTrainingStepKind, "welcome">,
  stepCount: number,
): number {
  switch (kind) {
    case "warm-up":
      return 1;
    case "practice":
      return stepCount - 3;
    case "reflect":
      return stepCount - 2;
    case "complete":
      return stepCount - 1;
  }
}
