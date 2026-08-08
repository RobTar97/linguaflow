import { Database, Languages, Settings2 } from "lucide-react";
import { localeNames } from "../content/topics";
import type { Locale, WorkspaceRole } from "../domain/types";
import { workspaceCopy } from "../i18n/workspaceCopy";
import { useLearningWorkspace } from "../workspace/context";
import { Brand } from "./Brand";
import { SoundToggle } from "./SoundToggle";

const roleRoutes: Array<{ role: WorkspaceRole; copyKey: "practice" | "teach" | "join" }> = [
  { role: "learner", copyKey: "practice" },
  { role: "teacher", copyKey: "teach" },
  { role: "student", copyKey: "join" },
];

export function WorkspaceHeader() {
  const { profile, switchRole, navigate, updateGoal } = useLearningWorkspace();
  if (!profile) return null;
  const copy = workspaceCopy[profile.goal.interfaceLocale];

  return (
    <header className="workspace-header">
      <button className="brand-button" type="button" onClick={() => switchRole("learner")}>
        <Brand />
      </button>
      <nav className="role-navigation" aria-label="Workspace role">
        {roleRoutes.map((item) => (
          <button
            key={item.role}
            className={profile.role === item.role ? "active" : ""}
            type="button"
            onClick={() => switchRole(item.role)}
          >
            {copy[item.copyKey]}
          </button>
        ))}
      </nav>
      <div className="workspace-header-actions">
        <span className="goal-summary">
          <Languages size={16} />
          {profile.goal.nativeLanguage} → <strong>{profile.goal.targetLanguage}</strong>
          <span>{profile.goal.level}</span>
        </span>
        <label className="compact-locale-select">
          <span className="sr-only">{copy.interfaceLanguage}</span>
          <select
            value={profile.goal.interfaceLocale}
            onChange={(event) =>
              updateGoal({ interfaceLocale: event.target.value as Locale })
            }
          >
            {(Object.keys(localeNames) as Locale[]).map((locale) => (
              <option key={locale} value={locale}>
                {localeNames[locale]}
              </option>
            ))}
          </select>
        </label>
        <SoundToggle locale={profile.goal.interfaceLocale} />
        <button className="header-icon-button" type="button" onClick={() => navigate("data")} aria-label="Learner data import and export">
          <Database size={19} />
        </button>
        <button
          className="header-icon-button"
          type="button"
          onClick={() => navigate("setup")}
          aria-label={copy.setup}
        >
          <Settings2 size={19} />
        </button>
      </div>
    </header>
  );
}
