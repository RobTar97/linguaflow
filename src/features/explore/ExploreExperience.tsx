import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  CircleUserRound,
  Clipboard,
  Languages,
  MessageCircle,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  startTransition,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { topicCatalog, topicCategories, cefrLevels } from "../../catalog/topicCatalog";
import { categoryCopy, localeNames, uiCopy } from "../../content/topics";
import type { Category, Level, Locale, Topic } from "../../domain/types";
import { workspaceCopy } from "../../i18n/workspaceCopy";
import {
  contentItemVariants,
  contentListVariants,
  motionEase,
  questionVariants,
} from "../../motion/presets";
import { useLearningWorkspace } from "../../workspace/context";

const topics = topicCatalog.all();
const categories = topicCategories;
const levels = cefrLevels;
const pairs = ["EN-PL", "EN-JA", "PL-JA"] as const;

const spring = { type: "spring", stiffness: 420, damping: 34 } as const;

function pairForLanguages(first: Locale, second: Locale) {
  return (
    pairs.find((pair) => {
      const languages = pair.split("-");
      return languages.includes(first) && languages.includes(second);
    }) ?? "EN-PL"
  );
}

function ExploreExperience() {
  const {
    profile,
    route,
    navigate,
    savedIds,
    toggleSaved,
    updateGoal,
    switchRole,
  } = useLearningWorkspace();
  const goal = profile!.goal;
  const locale = goal.interfaceLocale;
  const view = route === "saved" ? "saved" : "browse";
  const [selectedId, setSelectedId] = useState(topics[0].id);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [level, setLevel] = useState<Level | "all">(goal.level);
  const [pair, setPair] = useState<(typeof pairs)[number] | "all">(
    pairForLanguages(goal.nativeLanguage, goal.targetLanguage),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const copy = uiCopy[locale];

  const visibleTopics = useMemo(() => {
    const [first, second] = pair === "all" ? [undefined, undefined] : pair.split("-");
    return topicCatalog.browse({
      search: query,
      category,
      level,
      nativeLanguage: first as Locale | undefined,
      targetLanguage: second as Locale | undefined,
      savedIds: new Set(savedIds),
      savedOnly: view === "saved",
    });
  }, [category, level, pair, query, savedIds, view]);

  const selected =
    visibleTopics.find((topic) => topic.id === selectedId) ??
    visibleTopics[0] ??
    topics.find((topic) => topic.id === selectedId) ??
    topics[0];

  function selectTopic(topic: Topic) {
    startTransition(() => setSelectedId(topic.id));
    setMobileDetailOpen(true);
  }

  function clearFilters() {
    setCategory("all");
    setLevel(goal.level);
    setPair(pairForLanguages(goal.nativeLanguage, goal.targetLanguage));
    setQuery("");
  }

  return (
    <div className="app-shell">
      <Header
        locale={locale}
        setLocale={(nextLocale) => updateGoal({ interfaceLocale: nextLocale })}
        view={view}
        setView={(nextView) => navigate(nextView === "saved" ? "saved" : "explore")}
        onOpenSetup={() => navigate("setup")}
        onTeach={() => switchRole("teacher")}
        onJoin={() => switchRole("student")}
        teachLabel={workspaceCopy[locale].teach}
        joinLabel={workspaceCopy[locale].join}
        copy={copy}
        query={query}
        setQuery={setQuery}
      />

      <main className="workspace">
        <section className="browse-column" aria-labelledby="browse-heading">
          <div className="browse-intro">
            <div>
              <p className="eyebrow">
                <MessageCircle size={15} aria-hidden="true" />
                {workspaceCopy[locale].openSourceBeta}
              </p>
              <h1 id="browse-heading">
                {view === "browse" ? copy.heading : copy.saved}
              </h1>
              <p>{view === "browse" ? copy.subheading : copy.noSavedBody}</p>
              <div className="active-learning-goal">
                <Languages size={15} />
                <span>
                  {localeNames[goal.nativeLanguage]} →{" "}
                  <strong>{localeNames[goal.targetLanguage]}</strong>
                </span>
                <span className="level-tag">{goal.level}</span>
                <button type="button" onClick={() => navigate("setup")}>
                  Change
                </button>
              </div>
            </div>
            <button
              className="filter-mobile-button"
              type="button"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal size={18} />
              {copy.filters}
            </button>
          </div>

          <FilterBar
            locale={locale}
            category={category}
            setCategory={setCategory}
            level={level}
            setLevel={setLevel}
            pair={pair}
            setPair={setPair}
            clearFilters={clearFilters}
            copy={copy}
          />

          <div className="results-meta" aria-live="polite">
            <span>
              <strong>{visibleTopics.length}</strong> {copy.topics}
            </span>
            <span className="topic-path">
              {category === "all" ? copy.allCategories : categoryCopy[category][locale]}
            </span>
          </div>

          {visibleTopics.length ? (
            <motion.div
              className="topic-grid"
              layout
              variants={contentListVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {visibleTopics.map((topic, index) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    locale={locale}
                    selected={topic.id === selected.id}
                    saved={savedIds.includes(topic.id)}
                    onSelect={() => selectTopic(topic)}
                    onSave={() => toggleSaved(topic.id)}
                    savedLabel={copy.savedLabel}
                    saveLabel={copy.save}
                    motionIndex={index}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <EmptyState
              saved={view === "saved" && savedIds.length === 0}
              copy={copy}
              onAction={() => {
                clearFilters();
                navigate("explore");
              }}
            />
          )}
        </section>

        <aside
          className={`detail-column ${mobileDetailOpen ? "is-mobile-open" : ""}`}
          aria-label={selected.title[locale]}
        >
          <TopicDetail
            topic={selected}
            locale={locale}
            saved={savedIds.includes(selected.id)}
            onSave={() => toggleSaved(selected.id)}
            onStart={() => setSessionOpen(true)}
            onCloseMobile={() => setMobileDetailOpen(false)}
            copy={copy}
          />
        </aside>
      </main>

      <AnimatePresence>
        {filtersOpen ? (
          <MobileFilters
            locale={locale}
            category={category}
            setCategory={setCategory}
            level={level}
            setLevel={setLevel}
            pair={pair}
            setPair={setPair}
            clearFilters={clearFilters}
            copy={copy}
            onClose={() => setFiltersOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {sessionOpen ? (
          <ConversationMode
            topic={selected}
            locale={locale}
            copy={copy}
            onClose={() => setSessionOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

interface HeaderProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  view: "browse" | "saved";
  setView: (view: "browse" | "saved") => void;
  copy: (typeof uiCopy)[Locale];
  query: string;
  setQuery: (value: string) => void;
  onOpenSetup: () => void;
  onTeach: () => void;
  onJoin: () => void;
  teachLabel: string;
  joinLabel: string;
}

function Header({
  locale,
  setLocale,
  view,
  setView,
  copy,
  query,
  setQuery,
  onOpenSetup,
  onTeach,
  onJoin,
  teachLabel,
  joinLabel,
}: HeaderProps) {
  return (
    <header className="global-header">
      <a className="logo" href="#" aria-label="LinguaFlow home">
        <span className="logo-mark" aria-hidden="true">
          <MessageCircle size={22} fill="currentColor" />
          <span />
        </span>
        <span className="logo-text">
          Lingua<span>Flow</span>
        </span>
      </a>

      <nav className="main-nav" aria-label="Main navigation">
        <button
          className={view === "browse" ? "active" : ""}
          type="button"
          onClick={() => setView("browse")}
        >
          {copy.browse}
        </button>
        <button
          className={view === "saved" ? "active" : ""}
          type="button"
          onClick={() => setView("saved")}
        >
          {copy.saved}
        </button>
        <button type="button" onClick={onTeach}>
          {teachLabel}
        </button>
        <button type="button" onClick={onJoin}>
          {joinLabel}
        </button>
      </nav>

      <div className="header-actions">
        <label className="header-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">{copy.search}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.search}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={copy.clear}
            >
              <X size={15} />
            </button>
          ) : null}
        </label>
        <label className="locale-select">
          <Languages size={17} aria-hidden="true" />
          <span className="sr-only">Interface language</span>
          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
          >
            {(Object.keys(localeNames) as Locale[]).map((code) => (
              <option key={code} value={code}>
                {localeNames[code]}
              </option>
            ))}
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </label>
        <button
          className="profile-button"
          type="button"
          aria-label="Learning setup"
          onClick={onOpenSetup}
        >
          <CircleUserRound size={24} />
        </button>
      </div>
    </header>
  );
}

interface FilterProps {
  locale: Locale;
  category: Category | "all";
  setCategory: (value: Category | "all") => void;
  level: Level | "all";
  setLevel: (value: Level | "all") => void;
  pair: (typeof pairs)[number] | "all";
  setPair: (value: (typeof pairs)[number] | "all") => void;
  clearFilters: () => void;
  copy: (typeof uiCopy)[Locale];
}

function FilterBar(props: FilterProps) {
  return (
    <div className="filter-bar">
      <SelectFilter
        value={props.category}
        onChange={(value) => props.setCategory(value as Category | "all")}
        label={props.copy.allCategories}
        options={categories.map((item) => ({
          value: item,
          label: categoryCopy[item][props.locale],
        }))}
      />
      <SelectFilter
        value={props.pair}
        onChange={(value) =>
          props.setPair(value as (typeof pairs)[number] | "all")
        }
        label={props.copy.allPairs}
        options={pairs.map((item) => ({
          value: item,
          label: item.replace("-", " ↔ "),
        }))}
      />
      <SelectFilter
        value={props.level}
        onChange={(value) => props.setLevel(value as Level | "all")}
        label={props.copy.allLevels}
        options={levels.map((item) => ({ value: item, label: item }))}
      />
      {props.category !== "all" ||
      props.pair !== "all" ||
      props.level !== "all" ? (
        <button className="reset-button" type="button" onClick={props.clearFilters}>
          <X size={15} />
          {props.copy.clear}
        </button>
      ) : null}
    </div>
  );
}

function SelectFilter({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className={`select-filter ${value !== "all" ? "is-active" : ""}`}>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">{label}</option>
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={15} aria-hidden="true" />
    </label>
  );
}

function TopicCard({
  topic,
  locale,
  selected,
  saved,
  onSelect,
  onSave,
  saveLabel,
  savedLabel,
  motionIndex,
}: {
  topic: Topic;
  locale: Locale;
  selected: boolean;
  saved: boolean;
  onSelect: () => void;
  onSave: () => void;
  saveLabel: string;
  savedLabel: string;
  motionIndex: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.article
      layout
      variants={contentItemVariants(Boolean(reduceMotion), motionIndex)}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`topic-card ${selected ? "is-selected" : ""}`}
    >
      <button className="topic-card-hitbox" type="button" onClick={onSelect}>
        <TopicArt topic={topic} />
        <span className="topic-card-content">
          <strong>{topic.title[locale]}</strong>
          <span className="topic-description">{topic.description[locale]}</span>
          <span className="topic-card-tags">
            <span className="category-tag">
              {categoryCopy[topic.category][locale]}
            </span>
            <span
              className={`level-tag ${topic.level.startsWith("A") ? "beginner" : ""}`}
            >
              {topic.level}
            </span>
          </span>
          <span className="topic-card-footer">
            <span>{topic.languages.join(" ↔ ")}</span>
            <span>{topic.followUps[locale].length} Q</span>
          </span>
        </span>
      </button>
      <button
        className={`save-icon ${saved ? "is-saved" : ""}`}
        type="button"
        onClick={onSave}
        aria-label={saved ? savedLabel : saveLabel}
        aria-pressed={saved}
      >
        <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
      </button>
    </motion.article>
  );
}

function TopicArt({ topic, large = false }: { topic: Topic; large?: boolean }) {
  const column = topic.artIndex % 4;
  const row = Math.floor(topic.artIndex / 4);
  const style = {
    "--art-x": `${column * 33.333}%`,
    "--art-y": `${row * 50}%`,
  } as CSSProperties;
  return (
    <span
      className={`topic-art art-${topic.artIndex} ${large ? "is-large" : ""}`}
      data-atlas={topic.atlas ?? 1}
      style={style}
      role="img"
      aria-label={topic.title.EN}
    />
  );
}

function TopicDetail({
  topic,
  locale,
  saved,
  onSave,
  onStart,
  onCloseMobile,
  copy,
}: {
  topic: Topic;
  locale: Locale;
  saved: boolean;
  onSave: () => void;
  onStart: () => void;
  onCloseMobile: () => void;
  copy: (typeof uiCopy)[Locale];
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  async function copyQuestion(question: string, index: number) {
    await navigator.clipboard?.writeText(question);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1200);
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={topic.id}
        className="detail-panel"
        initial={{
          opacity: 0,
          transform: reduceMotion ? "none" : "translateX(12px)",
        }}
        animate={{ opacity: 1, transform: "none" }}
        exit={{
          opacity: 0,
          transform: reduceMotion ? "none" : "translateX(-8px)",
        }}
        transition={{ duration: 0.2, ease: motionEase }}
      >
        <button
          className="mobile-back"
          type="button"
          onClick={onCloseMobile}
        >
          <ArrowLeft size={18} />
          {copy.browse}
        </button>

        <div className="detail-hero">
          <TopicArt topic={topic} large />
          <button
            className={`detail-save-icon ${saved ? "is-saved" : ""}`}
            type="button"
            onClick={onSave}
            aria-label={saved ? copy.savedLabel : copy.save}
            aria-pressed={saved}
          >
            <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="detail-heading">
          <div>
            <div className="detail-meta">
              <span className="category-tag">
                {categoryCopy[topic.category][locale]}
              </span>
              <span
                className={`level-tag ${topic.level.startsWith("A") ? "beginner" : ""}`}
              >
                {topic.level}
              </span>
            </div>
            <h2>{topic.title[locale]}</h2>
            <p>{topic.description[locale]}</p>
          </div>
          <span className="language-pair">
            <Languages size={16} />
            {topic.languages.join(" ↔ ")}
          </span>
        </div>

        <section className="prompt-block">
          <p className="section-label">
            <MessageCircle size={17} />
            {copy.mainPrompt}
          </p>
          <p className="main-question">{topic.mainPrompt[locale]}</p>
        </section>

        <section className="detail-section">
          <p className="section-label">
            <SlidersHorizontal size={17} />
            {copy.followUps}
          </p>
          <ol className="question-list">
            {topic.followUps[locale].map((question, index) => (
              <li key={question}>
                <span className="question-number">{index + 1}</span>
                <span>{question}</span>
                <button
                  type="button"
                  onClick={() => copyQuestion(question, index)}
                  aria-label={copy.copy}
                >
                  {copiedIndex === index ? (
                    <Check size={16} />
                  ) : (
                    <Clipboard size={16} />
                  )}
                </button>
              </li>
            ))}
          </ol>
        </section>

        <section className="detail-section">
          <p className="section-label vocabulary-heading">
            <BookOpen size={17} />
            {copy.vocabulary}
          </p>
          <div className="vocabulary-grid">
            {topic.vocabulary[locale].map((item) => (
              <div className="vocabulary-item" key={`${item.word}-${item.translation}`}>
                <span>
                  <strong>{item.word}</strong>
                  <small>{item.part}</small>
                </span>
                <span>{item.translation}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="detail-actions">
          <button className="primary-button" type="button" onClick={onStart}>
            <MessageCircle size={18} fill="currentColor" />
            {copy.start}
            <ArrowRight size={18} />
          </button>
          <button
            className={`secondary-button ${saved ? "is-saved" : ""}`}
            type="button"
            onClick={onSave}
          >
            <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
            {saved ? copy.savedLabel : copy.save}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function EmptyState({
  saved,
  copy,
  onAction,
}: {
  saved: boolean;
  copy: (typeof uiCopy)[Locale];
  onAction: () => void;
}) {
  return (
    <div className="empty-state">
      <span>
        {saved ? <Bookmark size={28} /> : <Search size={28} />}
      </span>
      <h2>{saved ? copy.noSaved : copy.noResults}</h2>
      <p>{saved ? copy.noSavedBody : copy.noResultsBody}</p>
      <button className="secondary-button" type="button" onClick={onAction}>
        {saved ? copy.browseAction : copy.clear}
      </button>
    </div>
  );
}

function MobileFilters({
  onClose,
  ...props
}: FilterProps & { onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="sheet-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        className="filter-sheet"
        initial={{ transform: reduceMotion ? "none" : "translateY(100%)" }}
        animate={{ transform: "none" }}
        exit={{ transform: reduceMotion ? "none" : "translateY(100%)" }}
        transition={reduceMotion ? { duration: 0.12 } : spring}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-heading">
          <h2>{props.copy.filters}</h2>
          <button type="button" onClick={onClose} aria-label={props.copy.close}>
            <X size={20} />
          </button>
        </div>
        <FilterBar {...props} />
        <button className="primary-button" type="button" onClick={onClose}>
          <Check size={18} />
          {props.copy.filters}
        </button>
      </motion.div>
    </motion.div>
  );
}

function ConversationMode({
  topic,
  locale,
  copy,
  onClose,
}: {
  topic: Topic;
  locale: Locale;
  copy: (typeof uiCopy)[Locale];
  onClose: () => void;
}) {
  const questions = [topic.mainPrompt[locale], ...topic.followUps[locale]];
  const [questionIndex, setQuestionIndex] = useState(0);
  const isLast = questionIndex === questions.length - 1;
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="session-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        className="session-panel"
        initial={{
          opacity: 0,
          transform: reduceMotion ? "none" : "translateY(24px) scale(0.98)",
        }}
        animate={{ opacity: 1, transform: "none" }}
        exit={{
          opacity: 0,
          transform: reduceMotion ? "none" : "translateY(16px) scale(0.99)",
        }}
        transition={reduceMotion ? { duration: 0.12 } : spring}
        aria-modal="true"
        role="dialog"
        aria-labelledby="session-title"
      >
        <div className="session-topbar">
          <div className="session-status">
            <span className="live-dot" />
            {copy.sessionReady}
          </div>
          <button type="button" onClick={onClose} aria-label={copy.close}>
            <X size={20} />
          </button>
        </div>

        <div className="session-topic">
          <TopicArt topic={topic} />
          <div>
            <span>{categoryCopy[topic.category][locale]}</span>
            <h2 id="session-title">{topic.title[locale]}</h2>
            <p>{topic.languages.join(" ↔ ")} · {topic.level}</p>
          </div>
        </div>

        <div className="session-progress">
          <div>
            <span>{copy.progress}</span>
            <strong>
              {questionIndex + 1}/{questions.length}
            </strong>
          </div>
          <div className="progress-track">
            <motion.span
              style={{ transformOrigin: "left center" }}
              animate={{
                transform: `scaleX(${(questionIndex + 1) / questions.length})`,
              }}
              transition={{
                duration: reduceMotion ? 0 : 0.24,
                ease: [0.23, 1, 0.32, 1],
              }}
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={questions.length}
              aria-valuenow={questionIndex + 1}
            />
          </div>
        </div>

        <div className="session-question-wrap">
          <span>
            {copy.question} {questionIndex + 1}
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
          <small>{copy.sessionHint}</small>
        </div>

        <div className="session-vocab">
          {topic.vocabulary[locale].slice(0, 4).map((item) => (
            <span key={item.word}>
              <strong>{item.word}</strong>
              {item.translation}
            </span>
          ))}
        </div>

        <div className="session-actions">
          <button
            className="secondary-button"
            type="button"
            disabled={questionIndex === 0}
            onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              if (isLast) onClose();
              else setQuestionIndex((index) => index + 1);
            }}
          >
            {isLast ? copy.finish : copy.next}
            {isLast ? <Check size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}

export default ExploreExperience;
