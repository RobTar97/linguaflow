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
import { topicCategories, cefrLevels } from "../../catalog/topicCatalog";
import {
  categoryCopy,
  categoryDescriptions,
  localeNames,
  uiCopy,
} from "../../content/topics";
import type { Category, Level, Locale, Topic } from "../../domain/types";
import { createConversationSession } from "../../domain/conversationSession";
import { workspaceCopy } from "../../i18n/workspaceCopy";
import {
  contentItemVariants,
  contentListVariants,
  motionEase,
  motionEaseInOut,
  questionVariants,
} from "../../motion/presets";
import { readShareIntent } from "../../platform/shareLinks";
import { soundEffects } from "../../platform/soundEffects";
import { SoundToggle } from "../../ui/SoundToggle";
import { JapaneseReadingControls } from "../../ui/JapaneseReadingControls";
import { JapaneseText } from "../../ui/JapaneseText";
import { useLearningWorkspace } from "../../workspace/context";
import { useTopicLibrary } from "../../packs/libraryContext";

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
  const { catalog } = useTopicLibrary();
  const topics = catalog.all();
  const {
    profile,
    route,
    navigate,
    savedIds,
    toggleSaved,
    topicNotes,
    setTopicNote,
    vocabularyBookmarks,
    toggleVocabularyBookmark,
    updateGoal,
    switchRole,
  } = useLearningWorkspace();
  const goal = profile!.goal;
  const locale = goal.interfaceLocale;
  const view = route === "saved" ? "saved" : "browse";
  const practiceIntent = useMemo(() => {
    const intent = readShareIntent();
    if (intent?.kind !== "practice") return null;
    const topic = catalog.get(intent.topicId);
    return topic &&
      topic.languages.includes(intent.targetLanguage) &&
      topic.languages.includes(intent.supportLanguage)
      ? intent
      : null;
  }, [catalog]);
  const activeTargetLanguage =
    practiceIntent?.targetLanguage ?? goal.targetLanguage;
  const activeSupportLanguage =
    practiceIntent?.supportLanguage ?? goal.nativeLanguage;
  const [selectedId, setSelectedId] = useState(
    practiceIntent?.topicId ?? topics[0].id,
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [level, setLevel] = useState<Level | "all">(
    practiceIntent?.level ?? goal.level,
  );
  const [pair, setPair] = useState<(typeof pairs)[number] | "all">(
    pairForLanguages(activeSupportLanguage, activeTargetLanguage),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(Boolean(practiceIntent));
  const copy = uiCopy[locale];

  const categoryCounts = useMemo(() => {
    const [first, second] =
      pair === "all" ? [undefined, undefined] : pair.split("-");
    return new Map(
      categories.map((item) => [
        item,
        catalog.browse({
          category: item,
          nativeLanguage: first as Locale | undefined,
          targetLanguage: second as Locale | undefined,
        }).length,
      ]),
    );
  }, [catalog, pair]);

  const visibleTopics = useMemo(() => {
    const [first, second] = pair === "all" ? [undefined, undefined] : pair.split("-");
    return catalog.browse({
      search: query,
      category,
      level,
      nativeLanguage: first as Locale | undefined,
      targetLanguage: second as Locale | undefined,
      savedIds: new Set(savedIds),
      savedOnly: view === "saved",
    });
  }, [catalog, category, level, pair, query, savedIds, view]);

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

  function closeSession() {
    setSessionOpen(false);
    if (practiceIntent && typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }
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
        showJapaneseReadings={
          activeSupportLanguage === "JA" || activeTargetLanguage === "JA"
        }
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
                  {localeNames[activeSupportLanguage]} →{" "}
                  <strong>{localeNames[activeTargetLanguage]}</strong>
                </span>
                <span className="level-tag">
                  {practiceIntent?.level ?? goal.level}
                </span>
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

          {view === "browse" ? (
            <CategoryExplorer
              locale={locale}
              selected={category}
              counts={categoryCounts}
              onSelect={(nextCategory) => {
                setCategory(nextCategory);
                setLevel("all");
              }}
            />
          ) : null}

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

          <AnimatePresence mode="sync" initial={false}>
            {visibleTopics.length ? (
              <motion.div
                key="topic-results"
                className="topic-grid"
                variants={contentListVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
              >
                <AnimatePresence initial={false}>
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
                      matchingQuestion={findMatchingQuestion(
                        topic,
                        query,
                        locale,
                      )}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <EmptyState
                key="empty-results"
                saved={view === "saved" && savedIds.length === 0}
                copy={copy}
                onAction={() => {
                  clearFilters();
                  navigate("explore");
                }}
              />
            )}
          </AnimatePresence>
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
            questionLocale={activeTargetLanguage}
            note={topicNotes[selected.id] ?? ""}
            onNoteChange={(note) => setTopicNote(selected.id, note)}
            vocabularyBookmarks={vocabularyBookmarks}
            onToggleVocabulary={toggleVocabularyBookmark}
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
            questionLocale={activeTargetLanguage}
            supportLocale={activeSupportLanguage}
            copy={copy}
            onClose={closeSession}
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
  showJapaneseReadings: boolean;
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
  showJapaneseReadings,
}: HeaderProps) {
  return (
    <header
      className={`global-header ${showJapaneseReadings ? "has-japanese-readings" : ""}`}
    >
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
        {showJapaneseReadings ? (
          <JapaneseReadingControls locale={locale} />
        ) : null}
        <SoundToggle locale={locale} />
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

function CategoryExplorer({
  locale,
  selected,
  counts,
  onSelect,
}: {
  locale: Locale;
  selected: Category | "all";
  counts: Map<Category, number>;
  onSelect: (category: Category | "all") => void;
}) {
  return (
    <section className="category-explorer" aria-labelledby="category-heading">
      <div className="category-explorer-heading">
        <div>
          <p className="section-label" id="category-heading">
            <SlidersHorizontal size={16} />
            {uiCopy[locale].allCategories}
          </p>
          <p>
            {selected === "all"
              ? uiCopy[locale].subheading
              : categoryDescriptions[selected][locale]}
          </p>
        </div>
        {selected !== "all" ? (
          <button type="button" onClick={() => onSelect("all")}>
            {uiCopy[locale].clear}
          </button>
        ) : null}
      </div>
      <div className="category-grid">
        {categories.map((item, index) => {
          const column = index % 4;
          const row = Math.floor(index / 4);
          const style = {
            "--category-x": `${column * 33.333}%`,
            "--category-y": `${row * 50}%`,
          } as CSSProperties;
          return (
            <button
              className={selected === item ? "is-selected" : ""}
              type="button"
              key={item}
              onClick={() => onSelect(selected === item ? "all" : item)}
              aria-pressed={selected === item}
              disabled={(counts.get(item) ?? 0) === 0}
            >
              <span
                className="category-art"
                style={style}
                role="img"
                aria-label={categoryCopy[item][locale]}
              />
              <span>
                <strong>{categoryCopy[item][locale]}</strong>
                <small>
                  {counts.get(item) ?? 0} {uiCopy[locale].topics}
                </small>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function findMatchingQuestion(topic: Topic, query: string, locale: Locale) {
  const normalized = query.trim().toLocaleLowerCase();
  if (normalized.length < 2) return undefined;
  const localeOrder = [
    locale,
    ...(["EN", "PL", "JA"] as Locale[]).filter((item) => item !== locale),
  ];
  for (const questionLocale of localeOrder) {
    const questions = [
      topic.mainPrompt[questionLocale],
      ...topic.followUps[questionLocale],
    ];
    const match = questions.find((question) =>
      question.toLocaleLowerCase().includes(normalized),
    );
    if (match) return match;
  }
  return undefined;
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
  matchingQuestion,
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
  matchingQuestion?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.article
      variants={contentItemVariants(Boolean(reduceMotion), motionIndex)}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`topic-card ${selected ? "is-selected" : ""}`}
    >
      <button className="topic-card-hitbox" type="button" onClick={onSelect}>
        <TopicArt topic={topic} />
        <span className="topic-card-content">
          <strong><JapaneseText text={topic.title[locale]} language={locale} /></strong>
          <span className="topic-description"><JapaneseText text={topic.description[locale]} language={locale} /></span>
          {matchingQuestion ? (
            <span className="matching-question">
              <MessageCircle size={13} aria-hidden="true" />
              {matchingQuestion}
            </span>
          ) : null}
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
  if (topic.artwork?.kind === "asset" && topic.artwork.objectUrl) {
    return (
      <img
        className={`topic-art pack-topic-art ${large ? "is-large" : ""}`}
        src={topic.artwork.objectUrl}
        alt={topic.title.EN}
        loading="lazy"
        decoding="async"
      />
    );
  }
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
  questionLocale,
  note,
  onNoteChange,
  vocabularyBookmarks,
  onToggleVocabulary,
}: {
  topic: Topic;
  locale: Locale;
  saved: boolean;
  onSave: () => void;
  onStart: () => void;
  onCloseMobile: () => void;
  copy: (typeof uiCopy)[Locale];
  questionLocale: Locale;
  note: string;
  onNoteChange: (note: string) => void;
  vocabularyBookmarks: string[];
  onToggleVocabulary: (key: string) => void;
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  async function copyQuestion(question: string, index: number) {
    await navigator.clipboard?.writeText(question);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1200);
  }

  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={topic.id}
        className="detail-panel"
        initial={{
          opacity: 0,
          transform: reduceMotion ? "none" : "translateX(12px)",
        }}
        animate={{
          opacity: 1,
          transform: "none",
          transition: { duration: 0.16, ease: motionEase },
        }}
        exit={{
          opacity: 0,
          transform: "none",
          transition: { duration: 0.1, ease: motionEase },
        }}
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
            <h2><JapaneseText text={topic.title[locale]} language={locale} /></h2>
            <p><JapaneseText text={topic.description[locale]} language={locale} /></p>
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
          <p className="main-question"><JapaneseText text={topic.mainPrompt[questionLocale]} language={questionLocale} /></p>
        </section>

        <section className="detail-section">
          <p className="section-label">
            <SlidersHorizontal size={17} />
            {copy.followUps}
          </p>
          <ol className="question-list">
            {topic.followUps[questionLocale].map((question, index) => (
              <li key={question}>
                <span className="question-number">{index + 1}</span>
                <span><JapaneseText text={question} language={questionLocale} /></span>
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
            {topic.vocabulary[questionLocale].map((item) => (
              <div className="vocabulary-item" key={`${item.word}-${item.translation}`}>
                <span>
                  <strong><JapaneseText text={item.word} language={questionLocale} /></strong>
                  <small><JapaneseText text={item.part} language={questionLocale} /></small>
                </span>
                <span>{item.translation}</span>
                <button
                  type="button"
                  className={vocabularyBookmarks.includes(`${topic.id}:${questionLocale}:${item.word}`) ? "is-saved" : ""}
                  onClick={() => onToggleVocabulary(`${topic.id}:${questionLocale}:${item.word}`)}
                  aria-label={`Bookmark ${item.word}`}
                ><Bookmark size={15} /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="detail-section learner-note">
          <p className="section-label">Private topic note</p>
          <textarea value={note} maxLength={2000} placeholder="Keep an idea, useful phrase, or question on this device…" onChange={(event) => onNoteChange(event.target.value)} />
          <small>Stored on this device and included only when you export your learner data.</small>
        </section>

        {topic.provenance ? <details className="provenance-panel"><summary>Authorship and provenance</summary><p>{topic.provenance.authors.map((author) => author.displayName).join(", ")} · {topic.provenance.license} · {topic.provenance.packId}@{topic.provenance.packVersion}</p><p>{topic.provenance.reviews.length ? `${topic.provenance.reviews.length} factual review assertions` : "No review assertions have been recorded."}</p></details> : null}

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
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, transform: reduceMotion ? "none" : "scale(0.99)" }}
      animate={{
        opacity: 1,
        transform: "none",
        transition: { duration: reduceMotion ? 0.1 : 0.16, ease: motionEase },
      }}
      exit={{ opacity: 0, transition: { duration: 0.1, ease: motionEase } }}
    >
      <span>
        {saved ? <Bookmark size={28} /> : <Search size={28} />}
      </span>
      <h2>{saved ? copy.noSaved : copy.noResults}</h2>
      <p>{saved ? copy.noSavedBody : copy.noResultsBody}</p>
      <button className="secondary-button" type="button" onClick={onAction}>
        {saved ? copy.browseAction : copy.clear}
      </button>
    </motion.div>
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
  questionLocale,
  supportLocale,
  copy,
  onClose,
}: {
  topic: Topic;
  locale: Locale;
  questionLocale: Locale;
  supportLocale: Locale;
  copy: (typeof uiCopy)[Locale];
  onClose: () => void;
}) {
  const session = createConversationSession(topic, questionLocale, supportLocale);
  const [questionIndex, setQuestionIndex] = useState(0);
  const sessionView = session.view(questionIndex);
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
          y: reduceMotion ? 0 : 24,
          scale: reduceMotion ? 1 : 0.98,
        }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{
          opacity: 0,
          y: reduceMotion ? 0 : 16,
          scale: reduceMotion ? 1 : 0.99,
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
            <h2 id="session-title"><JapaneseText text={topic.title[locale]} language={locale} /></h2>
            <p>{topic.languages.join(" ↔ ")} · {topic.level}</p>
          </div>
        </div>

        <div className="session-progress">
          <div>
            <span>{copy.progress}</span>
            <strong>
              {sessionView.index + 1}/{sessionView.total}
            </strong>
          </div>
          <div className="progress-track">
            <motion.span
              style={{ transformOrigin: "left center" }}
              animate={{
                transform: `scaleX(${sessionView.progress})`,
              }}
              transition={{
                duration: reduceMotion ? 0 : 0.24,
                ease: motionEaseInOut,
              }}
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={sessionView.total}
              aria-valuenow={sessionView.index + 1}
            />
          </div>
        </div>

        <div className="session-question-wrap">
          <span>
            {copy.question} {sessionView.index + 1}
          </span>
          <AnimatePresence mode="sync">
            <motion.p
              key={questionIndex}
              variants={questionVariants(Boolean(reduceMotion))}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <JapaneseText text={sessionView.question.target} language={questionLocale} />
            </motion.p>
          </AnimatePresence>
          {sessionView.question.support ? (
            <details className="session-support">
              <summary>{workspaceCopy[locale].supportTranslation}</summary>
              <p><JapaneseText text={sessionView.question.support} language={supportLocale} /></p>
            </details>
          ) : null}
          <small>{copy.sessionHint}</small>
        </div>

        <div className="session-vocab">
          {session.vocabulary.slice(0, 4).map((item) => (
            <span key={item.word}>
              <strong><JapaneseText text={item.word} language={questionLocale} /></strong>
              {item.translation}
            </span>
          ))}
        </div>

        <div className="session-actions">
          <button
            className="secondary-button"
            type="button"
            disabled={sessionView.isFirst}
            onClick={() => {
              setQuestionIndex((index) => session.previous(index));
              soundEffects.play("question-step");
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              if (sessionView.isLast) {
                onClose();
                soundEffects.play("action-success");
              } else {
                setQuestionIndex((index) => session.next(index));
                soundEffects.play("question-step");
              }
            }}
          >
            {sessionView.isLast ? copy.finish : copy.next}
            {sessionView.isLast ? <Check size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}

export default ExploreExperience;
