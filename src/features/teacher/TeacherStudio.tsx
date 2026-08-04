import {
  ArrowRight,
  Check,
  Clock3,
  Languages,
  Presentation,
  Radio,
  LoaderCircle,
  Link2,
  MessageCircle,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { topicCatalog } from "../../catalog/topicCatalog";
import { categoryCopy, localeNames } from "../../content/topics";
import type { LanguageCode, Level, RoomSessionMode } from "../../domain/types";
import { workspaceCopy } from "../../i18n/workspaceCopy";
import { buildPracticeUrl } from "../../platform/shareLinks";
import { soundEffects } from "../../platform/soundEffects";
import { WorkspaceHeader } from "../../ui/WorkspaceHeader";
import { useLearningWorkspace } from "../../workspace/context";

export default function TeacherStudio() {
  const {
    profile,
    activeRoom,
    canControlActiveRoom,
    navigate,
    createRoom,
  } = useLearningWorkspace();
  const goal = profile!.goal;
  const copy = workspaceCopy[goal.interfaceLocale];
  const recommended = useMemo(() => topicCatalog.recommend(goal), [goal]);
  const [selectedTopicId, setSelectedTopicId] = useState(
    recommended[0]?.id ?? topicCatalog.all()[0].id,
  );
  const [roomName, setRoomName] = useState("Conversation practice");
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>(
    goal.targetLanguage,
  );
  const [supportLanguage, setSupportLanguage] = useState<LanguageCode>(
    goal.nativeLanguage,
  );
  const [level, setLevel] = useState<Level>(goal.level);
  const [sessionMode, setSessionMode] = useState<RoomSessionMode>(
    "guided-training",
  );
  const [creating, setCreating] = useState(false);
  const [roomError, setRoomError] = useState("");
  const [practiceCopied, setPracticeCopied] = useState(false);
  const topic = topicCatalog.get(selectedTopicId)!;

  async function handleCreateRoom() {
    setCreating(true);
    setRoomError("");
    try {
      await createRoom({
        name: roomName.trim() || topic.title[goal.interfaceLocale],
        topicId: selectedTopicId,
        targetLanguage,
        supportLanguage,
        level,
        sessionMode,
      });
      soundEffects.play("action-success");
    } catch {
      setRoomError(copy.roomServiceError);
    } finally {
      setCreating(false);
    }
  }

  async function copyPracticeLink() {
    await navigator.clipboard?.writeText(
      buildPracticeUrl({
        topicId: selectedTopicId,
        targetLanguage,
        supportLanguage,
        level,
      }),
    );
    soundEffects.play("action-success");
    setPracticeCopied(true);
    window.setTimeout(() => setPracticeCopied(false), 1_500);
  }

  return (
    <div className="workspace-page">
      <WorkspaceHeader />
      <main className="teacher-studio">
        <header className="studio-heading">
          <div>
            <p className="eyebrow">
              <Presentation size={16} />
              {copy.teacherStudio}
            </p>
            <h1>{copy.teacherStudio}</h1>
            <p>{copy.teacherIntro}</p>
          </div>
          {activeRoom && canControlActiveRoom ? (
            <button
              className="secondary-button"
              type="button"
              onClick={() => navigate("teacher-room")}
            >
              <Radio size={17} />
              {copy.resumeRoom}
            </button>
          ) : null}
        </header>

        <ol className="journey-steps">
          <li className="active">
            <span>1</span>
            <strong>{copy.chooseTopic}</strong>
          </li>
          <li>
            <span>2</span>
            <strong>{copy.roomDetails}</strong>
          </li>
          <li>
            <span>3</span>
            <strong>{copy.shareRoom}</strong>
          </li>
        </ol>

        <div className="teacher-layout">
          <section className="teacher-topic-picker">
            <div className="section-heading-row">
              <div>
                <h2>{copy.chooseTopic}</h2>
                <p>{copy.recommended}</p>
              </div>
              <span className="goal-summary">
                {goal.nativeLanguage} → <strong>{goal.targetLanguage}</strong>
                <span>{goal.level}</span>
              </span>
            </div>
            <div className="teacher-topic-list">
              {recommended.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={selectedTopicId === item.id ? "selected" : ""}
                  onClick={() => setSelectedTopicId(item.id)}
                >
                  <span
                    className={`topic-art art-${item.artIndex}`}
                    data-atlas={item.atlas ?? 1}
                    role="img"
                    aria-label={item.title[goal.interfaceLocale]}
                    style={
                      {
                        "--art-x": `${(item.artIndex % 4) * 33.333}%`,
                        "--art-y": `${Math.floor(item.artIndex / 4) * 50}%`,
                      } as React.CSSProperties
                    }
                  />
                  <span>
                    <strong>{item.title[goal.interfaceLocale]}</strong>
                    <small>{categoryCopy[item.category][goal.interfaceLocale]}</small>
                  </span>
                  <span className="level-tag">{item.level}</span>
                  {selectedTopicId === item.id ? <Check size={18} /> : null}
                </button>
              ))}
            </div>
          </section>

          <aside className="room-builder">
            <div className="room-preview">
              <span
                className={`topic-art art-${topic.artIndex}`}
                data-atlas={topic.atlas ?? 1}
                role="img"
                aria-label={topic.title[goal.interfaceLocale]}
                style={
                  {
                    "--art-x": `${(topic.artIndex % 4) * 33.333}%`,
                    "--art-y": `${Math.floor(topic.artIndex / 4) * 50}%`,
                  } as React.CSSProperties
                }
              />
              <div>
                <span>{categoryCopy[topic.category][goal.interfaceLocale]}</span>
                <h2>{topic.title[goal.interfaceLocale]}</h2>
                <p>{topic.mainPrompt[targetLanguage]}</p>
              </div>
            </div>
            <div className="room-form">
              <label>
                <span>{copy.roomName}</span>
                <input
                  value={roomName}
                  onChange={(event) => setRoomName(event.target.value)}
                />
              </label>
              <div className="room-form-grid">
                <label>
                  <span>{copy.targetLanguage}</span>
                  <select
                    value={targetLanguage}
                    onChange={(event) => {
                      const next = event.target.value as LanguageCode;
                      setTargetLanguage(next);
                      setSupportLanguage(
                        topic.languages.find((language) => language !== next)!,
                      );
                    }}
                  >
                    {topic.languages.map((language) => (
                      <option key={language} value={language}>
                        {localeNames[language]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{copy.nativeLanguage}</span>
                  <select
                    value={supportLanguage}
                    onChange={(event) =>
                      setSupportLanguage(event.target.value as LanguageCode)
                    }
                  >
                    {topic.languages
                      .filter((language) => language !== targetLanguage)
                      .map((language) => (
                        <option key={language} value={language}>
                          {localeNames[language]}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  <span>{copy.level}</span>
                  <select
                    value={level}
                    onChange={(event) => setLevel(event.target.value as Level)}
                  >
                    {["A1", "A2", "B1", "B2", "C1"].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <fieldset className="session-mode-picker">
                <legend>{copy.sessionMode}</legend>
                <div className="session-mode-options">
                  <label
                    className={
                      sessionMode === "guided-training" ? "selected" : ""
                    }
                  >
                    <input
                      type="radio"
                      name="session-mode"
                      value="guided-training"
                      checked={sessionMode === "guided-training"}
                      onChange={() => setSessionMode("guided-training")}
                    />
                    <span className="session-mode-icon">
                      <Presentation size={17} />
                    </span>
                    <span>
                      <strong>{copy.guidedTraining}</strong>
                      <small>{copy.guidedTrainingHint}</small>
                    </span>
                  </label>
                  <label
                    className={
                      sessionMode === "shared-question" ? "selected" : ""
                    }
                  >
                    <input
                      type="radio"
                      name="session-mode"
                      value="shared-question"
                      checked={sessionMode === "shared-question"}
                      onChange={() => setSessionMode("shared-question")}
                    />
                    <span className="session-mode-icon is-neutral">
                      <MessageCircle size={17} />
                    </span>
                    <span>
                      <strong>{copy.sharedQuestion}</strong>
                      <small>{copy.sharedQuestionHint}</small>
                    </span>
                  </label>
                </div>
              </fieldset>
              <div className="room-facts">
                <span>
                  <Languages size={15} />
                  {supportLanguage} → {targetLanguage}
                </span>
                <span>
                  <Clock3 size={15} /> 15–25 min
                </span>
                <span>
                  <Users size={15} /> 2–12
                </span>
              </div>
              <div className="teaching-paths">
                <div>
                  <strong>{copy.selfPaced}</strong>
                  <span>{copy.selfPacedHint}</span>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => void copyPracticeLink()}
                  >
                    {practiceCopied ? <Check size={17} /> : <Link2 size={17} />}
                    {practiceCopied
                      ? copy.practiceLinkCopied
                      : copy.copyPracticeLink}
                  </button>
                </div>
                <div>
                  <strong>{copy.liveTogether}</strong>
                  <span>{copy.liveTogetherHint}</span>
                </div>
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={handleCreateRoom}
                disabled={creating}
              >
                {creating ? (
                  <LoaderCircle className="spin-icon" size={18} />
                ) : null}
                {creating ? copy.creatingRoom : copy.createRoom}
                {!creating ? <ArrowRight size={18} /> : null}
              </button>
              {roomError ? <p className="form-error" role="alert">{roomError}</p> : null}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
