import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clipboard,
  LogOut,
  MessageCircle,
  Radio,
  Users,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { topicCatalog } from "../../catalog/topicCatalog";
import { categoryCopy } from "../../content/topics";
import { workspaceCopy } from "../../i18n/workspaceCopy";
import { motionEase, questionVariants } from "../../motion/presets";
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
  const [copied, setCopied] = useState(false);
  const [controlError, setControlError] = useState("");

  useEffect(() => {
    if (!activeRoom) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshRoom();
    }, 2500);
    return () => window.clearInterval(interval);
  }, [activeRoom, refreshRoom]);

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
  const questionIndex = Math.min(activeRoom.questionIndex, questions.length - 1);
  const isLast = questionIndex === questions.length - 1;

  async function moveQuestion(index: number) {
    setControlError("");
    try {
      await updateRoomQuestion(index);
    } catch {
      setControlError(copy.roomServiceError);
    }
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
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
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
            </p>
            <h1>{activeRoom.name}</h1>
            <p>
              {activeRoom.supportLanguage} →{" "}
              <strong>{activeRoom.targetLanguage}</strong> · {activeRoom.level}
            </p>
          </div>
          <div className="room-code-card">
            <span>{copy.roomCode}</span>
            <strong>{activeRoom.code}</strong>
            <button type="button" onClick={copyCode}>
              {copied ? <Check size={17} /> : <Clipboard size={17} />}
              {copied ? copy.copied : copy.copyCode}
            </button>
          </div>
        </header>

        <div className="room-session-layout">
          <section className="presentation-board">
            <div className="presentation-topic">
              <span>{categoryCopy[topic.category][profile!.goal.interfaceLocale]}</span>
              <strong>{topic.title[profile!.goal.interfaceLocale]}</strong>
              <small>
                {questionIndex + 1}/{questions.length}
              </small>
            </div>
            <div className="presentation-progress" role="progressbar" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={questionIndex + 1}>
              <motion.span
                style={{ transformOrigin: "left center" }}
                animate={{
                  transform: `scaleX(${(questionIndex + 1) / questions.length})`,
                }}
                transition={{ duration: reduceMotion ? 0 : 0.24, ease: motionEase }}
              />
            </div>
            <div className="presentation-question">
              <span>
                <MessageCircle size={18} />
                {copy.currentQuestion}
              </span>
              <AnimatePresence mode="wait">
                <motion.p
                  key={questionIndex}
                  variants={questionVariants(Boolean(reduceMotion))}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {questions[questionIndex]}
                </motion.p>
              </AnimatePresence>
              <details>
                <summary>{copy.supportTranslation}</summary>
                <p>{supportQuestions[questionIndex]}</p>
              </details>
            </div>
            <div className="presentation-vocabulary">
              {topic.vocabulary[activeRoom.targetLanguage].slice(0, 6).map((item) => (
                <span key={item.word}>
                  <strong>{item.word}</strong>
                  {item.translation}
                </span>
              ))}
            </div>
            {mode === "teacher" ? (
              <div className="presentation-controls">
                <button
                  className="secondary-button"
                  type="button"
                  disabled={questionIndex === 0}
                  onClick={() => void moveQuestion(questionIndex - 1)}
                >
                  <ArrowLeft size={18} />
                  {copy.previous}
                </button>
                <button
                  className="primary-button"
                  type="button"
                  disabled={isLast}
                  onClick={() => void moveQuestion(questionIndex + 1)}
                >
                  {copy.nextQuestion}
                  <ArrowRight size={18} />
                </button>
              </div>
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
