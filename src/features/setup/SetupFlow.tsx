import {
  ArrowLeft,
  ArrowRight,
  Check,
  GraduationCap,
  Languages,
  Presentation,
  Users,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { useEffect } from "react";
import { cefrLevels } from "../../catalog/topicCatalog";
import { localeNames } from "../../content/topics";
import type {
  LanguageCode,
  Level,
  Locale,
  WorkspaceRole,
} from "../../domain/types";
import { workspaceCopy } from "../../i18n/workspaceCopy";
import { motionEase } from "../../motion/presets";
import { readShareIntent } from "../../platform/shareLinks";
import { useLearningWorkspace } from "../../workspace/context";
import { workspaceDefaults } from "../../workspace/contracts";
import { Brand } from "../../ui/Brand";

const languages = Object.keys(localeNames) as LanguageCode[];

const roleOptions = [
  {
    role: "learner" as const,
    icon: GraduationCap,
    title: "learner" as const,
    body: "learnerBody" as const,
  },
  {
    role: "teacher" as const,
    icon: Presentation,
    title: "teacher" as const,
    body: "teacherBody" as const,
  },
  {
    role: "student" as const,
    icon: Users,
    title: "student" as const,
    body: "studentBody" as const,
  },
];

export default function SetupFlow() {
  const { profile, completeSetup } = useLearningWorkspace();
  const shareIntent = readShareIntent();
  const practiceIntent = shareIntent?.kind === "practice" ? shareIntent : null;
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.name ?? "");
  const [role, setRole] = useState<WorkspaceRole>(
    profile?.role ?? (shareIntent?.kind === "join" ? "student" : "learner"),
  );
  const [interfaceLocale, setInterfaceLocale] = useState<Locale>(
    profile?.goal.interfaceLocale ?? workspaceDefaults.goal.interfaceLocale,
  );
  const [nativeLanguage, setNativeLanguage] = useState<LanguageCode>(
    profile?.goal.nativeLanguage ??
      practiceIntent?.supportLanguage ??
      workspaceDefaults.goal.nativeLanguage,
  );
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>(
    profile?.goal.targetLanguage ??
      practiceIntent?.targetLanguage ??
      workspaceDefaults.goal.targetLanguage,
  );
  const [level, setLevel] = useState<Level>(
    profile?.goal.level ?? practiceIntent?.level ?? workspaceDefaults.goal.level,
  );
  const reduceMotion = useReducedMotion();
  const copy = workspaceCopy[interfaceLocale];
  const stepLabels = [copy.profileStep, copy.languagesStep, copy.readyStep];

  useEffect(() => {
    document.documentElement.lang = interfaceLocale.toLowerCase();
  }, [interfaceLocale]);

  function setNative(next: LanguageCode) {
    setNativeLanguage(next);
    if (next === targetLanguage) {
      setTargetLanguage(languages.find((language) => language !== next) ?? "EN");
    }
  }

  function setTarget(next: LanguageCode) {
    setTargetLanguage(next);
    if (next === nativeLanguage) {
      setNativeLanguage(languages.find((language) => language !== next) ?? "PL");
    }
  }

  function finish() {
    completeSetup({
      name: name.trim() || (role === "teacher" ? "Teacher" : "Learner"),
      role,
      setupComplete: true,
      goal: {
        interfaceLocale,
        nativeLanguage,
        targetLanguage,
        level,
      },
    });
  }

  return (
    <main className="setup-shell">
      <header className="setup-header">
        <Brand />
        <span>{copy.openSourceBeta}</span>
      </header>
      <section className="setup-card">
        <ol className="setup-progress" aria-label={`Step ${step + 1} of 3`}>
          {stepLabels.map((label, item) => (
            <li
              key={label}
              className={step >= item ? "active" : ""}
              aria-current={step === item ? "step" : undefined}
            >
              <span>{item + 1}</span>
              <small>{label}</small>
            </li>
          ))}
        </ol>
        <AnimatePresence mode="sync">
          <motion.div
            key={step}
            className="setup-step"
            initial={{
              opacity: 0,
              transform: reduceMotion ? "none" : "translateY(10px)",
            }}
            animate={{ opacity: 1, transform: "none" }}
            exit={{
              opacity: 0,
              transform: reduceMotion ? "none" : "translateY(-8px)",
            }}
            transition={{ duration: 0.16, ease: motionEase }}
          >
            {step === 0 ? (
              <>
                <p className="eyebrow">
                  <Languages size={15} />
                  {copy.openSourceBeta}
                </p>
                <h1>{copy.welcome}</h1>
                <p className="setup-lead">{copy.welcomeBody}</p>
                <label className="setup-field">
                  <span>{copy.yourName}</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={role === "teacher" ? "Kasia" : "Alex"}
                  />
                </label>
                <p className="setup-privacy-note">{copy.privacyNote}</p>
                <fieldset className="role-options">
                  <legend>{copy.chooseRole}</legend>
                  {roleOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.role}
                        type="button"
                        className={role === option.role ? "selected" : ""}
                        onClick={() => setRole(option.role)}
                      >
                        <span className="role-icon">
                          <Icon size={22} />
                        </span>
                        <span>
                          <strong>{copy[option.title]}</strong>
                          <small>{copy[option.body]}</small>
                        </span>
                        {role === option.role ? <Check size={19} /> : null}
                      </button>
                    );
                  })}
                </fieldset>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <p className="eyebrow">
                  <Languages size={15} />
                  {copy.setup}
                </p>
                <h1>{copy.languageSetupTitle}</h1>
                <p className="setup-lead">{copy.languageSetupBody}</p>
                <div className="language-setup-grid">
                  <label className="setup-field">
                    <span>{copy.interfaceLanguage}</span>
                    <select
                      value={interfaceLocale}
                      onChange={(event) =>
                        setInterfaceLocale(event.target.value as Locale)
                      }
                    >
                      {languages.map((language) => (
                        <option key={language} value={language}>
                          {localeNames[language]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="setup-field">
                    <span>{copy.nativeLanguage}</span>
                    <small>{copy.nativeHint}</small>
                    <select
                      value={nativeLanguage}
                      onChange={(event) =>
                        setNative(event.target.value as LanguageCode)
                      }
                    >
                      {languages.map((language) => (
                        <option key={language} value={language}>
                          {localeNames[language]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="setup-field target-field">
                    <span>{copy.targetLanguage}</span>
                    <small>{copy.targetHint}</small>
                    <select
                      value={targetLanguage}
                      onChange={(event) =>
                        setTarget(event.target.value as LanguageCode)
                      }
                    >
                      {languages.map((language) => (
                        <option
                          key={language}
                          value={language}
                          disabled={language === nativeLanguage}
                        >
                          {localeNames[language]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <fieldset className="level-picker">
                  <legend>{copy.level}</legend>
                  {cefrLevels.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={level === item ? "selected" : ""}
                      onClick={() => setLevel(item)}
                    >
                      {item}
                    </button>
                  ))}
                  <small>{copy.levelHint}</small>
                </fieldset>
              </>
            ) : null}

            {step === 2 ? (
              <div className="setup-confirmation">
                <span className="confirmation-mark">
                  <Check size={30} />
                </span>
                <h1>{copy.confirmTitle}</h1>
                <p>{copy.confirmBody}</p>
                <div className="goal-confirmation">
                  <span>{localeNames[nativeLanguage]}</span>
                  <ArrowRight size={22} />
                  <strong>{localeNames[targetLanguage]}</strong>
                  <span className="level-tag">{level}</span>
                </div>
                <div className="confirmation-role">
                  {copy[role === "learner" ? "learner" : role]}
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <footer className="setup-actions">
          {step > 0 ? (
            <button className="secondary-button" type="button" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={18} />
              {copy.back}
            </button>
          ) : (
            <span />
          )}
          <button
            className="primary-button"
            type="button"
            onClick={() => (step === 2 ? finish() : setStep(step + 1))}
          >
            {step === 2 ? copy.saveSetup : copy.continue}
            {step === 2 ? <Check size={18} /> : <ArrowRight size={18} />}
          </button>
        </footer>
      </section>
    </main>
  );
}
