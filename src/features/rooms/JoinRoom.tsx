import { ArrowRight, Hash, LoaderCircle, Users } from "lucide-react";
import { useState } from "react";
import { workspaceCopy } from "../../i18n/workspaceCopy";
import { readShareIntent } from "../../platform/shareLinks";
import { WorkspaceHeader } from "../../ui/WorkspaceHeader";
import { useLearningWorkspace } from "../../workspace/context";

export default function JoinRoom() {
  const { profile, joinRoom } = useLearningWorkspace();
  const copy = workspaceCopy[profile!.goal.interfaceLocale];
  const invite = readShareIntent();
  const [name, setName] = useState(profile?.name ?? "");
  const [code, setCode] = useState(
    invite?.kind === "join" ? invite.code : "",
  );
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  function formatCode(value: string) {
    const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    return compact.length > 3
      ? `${compact.slice(0, 3)}-${compact.slice(3)}`
      : compact;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !/^[A-Z]{3}-[0-9]{3}$/.test(code)) return;
    setJoining(true);
    const result = await joinRoom(code, name);
    setError(
      result.error
        ? result.error.toLowerCase().includes("not found") ||
          result.error.toLowerCase().includes("expired")
          ? copy.roomNotFound
          : copy.roomServiceError
        : "",
    );
    setJoining(false);
  }

  return (
    <div className="workspace-page">
      <WorkspaceHeader />
      <main className="join-room-page">
        <section className="join-room-card">
          <span className="join-room-icon">
            <Users size={28} />
          </span>
          <p className="eyebrow">{copy.join}</p>
          <h1>{copy.joinTitle}</h1>
          <p>{copy.joinIntro}</p>
          <form onSubmit={submit}>
            <label>
              <span>{copy.studentName}</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              <span>{copy.enterCode}</span>
              <div className="room-code-input">
                <Hash size={19} />
                <input
                  value={code}
                  onChange={(event) => {
                    setCode(formatCode(event.target.value));
                    setError("");
                  }}
                  placeholder="ABC-123"
                  maxLength={7}
                  autoCapitalize="characters"
                />
              </div>
            </label>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button
              className="primary-button"
              type="submit"
              disabled={joining || !name.trim() || !/^[A-Z]{3}-[0-9]{3}$/.test(code)}
            >
              {joining ? <LoaderCircle className="spin-icon" size={18} /> : null}
              {joining ? copy.joiningRoom : copy.joinRoom}
              {!joining ? <ArrowRight size={18} /> : null}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
