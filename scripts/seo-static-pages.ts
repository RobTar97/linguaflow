import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";
import { topicCatalog } from "../src/catalog/topicCatalog";
import { categoryCopy } from "../src/content/topics";
import type { Locale, Topic } from "../src/domain/types";

const OUTPUT_DIR = resolve("dist");
const CONTENT_LAST_MODIFIED = "2026-07-30";
const REPOSITORY_URL = "https://github.com/RobTar97/linguaflow";
const locales: Locale[] = ["EN", "PL", "JA"];
const languageLabels: Record<Locale, Record<Locale, string>> = {
  EN: { EN: "English", PL: "Polish", JA: "Japanese" },
  PL: { EN: "angielski", PL: "polski", JA: "japoński" },
  JA: { EN: "英語", PL: "ポーランド語", JA: "日本語" },
};

const localeConfig = {
  EN: {
    code: "en",
    og: "en_US",
    hubTitle: "Conversation Questions in English | LinguaFlow",
    hubDescription:
      "Browse free English conversation questions, CEFR-level prompts, and multilingual vocabulary for learners, teachers, and language exchanges.",
    hubHeading: "English conversation questions",
    hubIntro:
      "Choose a real-life topic and use the central prompt, follow-up questions, and vocabulary to practise speaking English. Every resource is free, classroom-ready, and available without an account.",
    questions: "Conversation questions",
    vocabulary: "Useful vocabulary",
    useTitle: "How to use this conversation topic",
    useSteps: [
      "Read the central prompt aloud and give everyone quiet thinking time.",
      "Use the follow-up questions naturally instead of treating them as a test.",
      "Review the vocabulary only when a speaker needs support.",
    ],
    cta: "Practise this topic in LinguaFlow",
    allTopics: "All English conversation topics",
    category: "Category",
    level: "CEFR level",
    languagePair: "Language pair",
    mainPrompt: "Central conversation prompt",
    related: "Related conversation topics",
    word: "Word",
    support: "Translation",
    part: "Part of speech",
    home: "Home",
  },
  PL: {
    code: "pl",
    og: "pl_PL",
    hubTitle: "Pytania do rozmowy po polsku | LinguaFlow",
    hubDescription:
      "Bezpłatne pytania do rozmowy po polsku, tematy według poziomu CEFR i wielojęzyczne słownictwo dla uczniów i nauczycieli.",
    hubHeading: "Pytania do rozmowy po polsku",
    hubIntro:
      "Wybierz temat z życia codziennego i wykorzystaj pytanie główne, pytania dodatkowe oraz słownictwo do ćwiczenia mówienia po polsku. Każdy materiał jest bezpłatny i gotowy do użycia na lekcji.",
    questions: "Pytania do rozmowy",
    vocabulary: "Przydatne słownictwo",
    useTitle: "Jak korzystać z tego tematu",
    useSteps: [
      "Przeczytaj pytanie główne na głos i daj wszystkim chwilę na zastanowienie.",
      "Zadawaj pytania dodatkowe naturalnie, bez zamieniania rozmowy w test.",
      "Sięgaj do słownictwa wtedy, gdy rozmówca potrzebuje wsparcia.",
    ],
    cta: "Ćwicz ten temat w LinguaFlow",
    allTopics: "Wszystkie tematy po polsku",
    category: "Kategoria",
    level: "Poziom CEFR",
    languagePair: "Para językowa",
    mainPrompt: "Główne pytanie do rozmowy",
    related: "Powiązane tematy do rozmowy",
    word: "Słowo",
    support: "Tłumaczenie",
    part: "Część mowy",
    home: "Strona główna",
  },
  JA: {
    code: "ja",
    og: "ja_JP",
    hubTitle: "日本語の会話質問・トピック | LinguaFlow",
    hubDescription:
      "学習者、教師、言語交換向けの無料の日本語会話質問、CEFR別トピック、多言語の語彙サポートを探せます。",
    hubHeading: "日本語の会話質問",
    hubIntro:
      "日常に近いトピックを選び、メインの質問、追加質問、語彙を使って日本語で話す練習ができます。すべて無料で、アカウントなしでも授業や言語交換に利用できます。",
    questions: "会話の質問",
    vocabulary: "役立つ語彙",
    useTitle: "この会話トピックの使い方",
    useSteps: [
      "メインの質問を声に出して読み、考える時間を取りましょう。",
      "テストのようにせず、会話の流れに合わせて追加質問を使いましょう。",
      "話し手が必要なときだけ語彙サポートを確認しましょう。",
    ],
    cta: "LinguaFlowでこのトピックを練習",
    allTopics: "日本語の会話トピック一覧",
    category: "カテゴリー",
    level: "CEFRレベル",
    languagePair: "言語ペア",
    mainPrompt: "メインの会話質問",
    related: "関連する会話トピック",
    word: "単語",
    support: "訳",
    part: "品詞",
    home: "ホーム",
  },
} as const;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function jsonLd(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function cleanBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function topicPath(locale: Locale, topic: Topic) {
  return `/${localeConfig[locale].code}/topics/${topic.id}/`;
}

function alternateLinks(baseUrl: string, topic?: Topic) {
  return [
    ...locales.map((locale) => {
      const path = topic ? topicPath(locale, topic) : `/${localeConfig[locale].code}/`;
      return `<link rel="alternate" hreflang="${localeConfig[locale].code}" href="${baseUrl}${path}" />`;
    }),
    `<link rel="alternate" hreflang="x-default" href="${baseUrl}${topic ? topicPath("EN", topic) : "/"}" />`,
  ].join("\n    ");
}

function staticStyles() {
  return `
    :root{color:#1e2428;background:#faf8f5;font:16px/1.6 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    *{box-sizing:border-box}body{margin:0}a{color:#b5381e}a:hover{text-decoration-thickness:2px}
    .page{width:min(1120px,calc(100% - 32px));margin:auto}.site-header,.site-footer{display:flex;gap:20px;align-items:center;justify-content:space-between;padding:22px 0}
    .brand{color:#1e2428;font-size:1.25rem;font-weight:800;text-decoration:none}.brand span{color:#c93e1f}
    nav{display:flex;gap:16px;flex-wrap:wrap}main{padding:42px 0 64px}.eyebrow{color:#b5381e;font-size:.8rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    h1{max-width:850px;margin:.2em 0;font-size:clamp(2rem,6vw,4.3rem);line-height:1.05;letter-spacing:-.04em}h2{margin-top:2.4rem;line-height:1.2}
    .lede{max-width:760px;color:#4e5a60;font-size:1.15rem}.meta,.card,.prompt,.cta{border:1px solid #e5dfd8;border-radius:18px;background:#fff;box-shadow:0 10px 32px rgba(46,35,28,.05)}
    .meta{display:flex;gap:12px;flex-wrap:wrap;padding:14px 18px}.meta span{font-weight:700}.prompt{padding:22px;font-size:1.15rem}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}.card{display:block;padding:18px;color:inherit;text-decoration:none}.card:hover{border-color:#d46a50}
    .card strong{display:block;margin-bottom:6px}.card small{color:#667177}.questions li,.steps li{margin:.65rem 0}.vocab{width:100%;border-collapse:collapse}.vocab th,.vocab td{padding:10px;border-bottom:1px solid #e5dfd8;text-align:left}
    .cta{margin-top:32px;padding:24px}.button{display:inline-block;margin-top:10px;padding:12px 18px;border-radius:12px;color:#fff;background:#e9532b;font-weight:800;text-decoration:none}
    .site-footer{border-top:1px solid #e5dfd8;color:#667177;font-size:.9rem}@media(max-width:640px){.site-header,.site-footer{align-items:flex-start;flex-direction:column}main{padding-top:24px}}
  `;
}

function documentShell(options: {
  baseUrl: string;
  locale: Locale;
  title: string;
  description: string;
  canonicalPath: string;
  body: string;
  schema: unknown;
  alternates?: string;
  type?: string;
}) {
  const { baseUrl, locale, title, description, canonicalPath, body, schema } =
    options;
  const canonical = `${baseUrl}${canonicalPath}`;
  const copy = localeConfig[locale];
  return `<!doctype html>
<html lang="${copy.code}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#faf8f5" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <link rel="canonical" href="${canonical}" />
    ${options.alternates ?? ""}
    <meta property="og:type" content="${options.type ?? "article"}" />
    <meta property="og:site_name" content="LinguaFlow" />
    <meta property="og:locale" content="${copy.og}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${baseUrl}/og-image-v2.jpg" />
    <meta property="og:image:width" content="1280" />
    <meta property="og:image:height" content="640" />
    <meta property="og:image:alt" content="LinguaFlow multilingual conversation practice workspace" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${baseUrl}/og-image-v2.jpg" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="manifest" href="/site.webmanifest" />
    <title>${escapeHtml(title)}</title>
    <style>${staticStyles()}</style>
    <script type="application/ld+json">${jsonLd(schema)}</script>
  </head>
  <body>
    ${body}
  </body>
</html>`;
}

function header(baseUrl: string, locale: Locale) {
  const copy = localeConfig[locale];
  return `<header class="site-header page">
    <a class="brand" href="${baseUrl}/" aria-label="LinguaFlow home">Lingua<span>Flow</span></a>
    <nav aria-label="Primary">
      <a href="${baseUrl}/${copy.code}/">${copy.allTopics}</a>
      <a href="${baseUrl}/teachers/">Teachers</a>
      <a href="${baseUrl}/about/">About</a>
      <a href="${baseUrl}/privacy/">Privacy</a>
    </nav>
  </header>`;
}

function footer() {
  return `<footer class="site-footer page">
    <span>LinguaFlow · Open-source conversation practice · MIT License</span>
    <a href="${REPOSITORY_URL}">Source code and contributions</a>
  </footer>`;
}

function topicDescription(topic: Topic, locale: Locale) {
  const title = topic.title[locale];
  const pair = topic.languages
    .map((language) => languageLabels[locale][language])
    .join("–");
  const suffix = {
    EN: `${topic.level} ${pair} conversation questions with follow-up prompts and vocabulary. Start practising free with LinguaFlow.`,
    PL: `Pytania do rozmowy na poziomie ${topic.level} (${pair}), dodatkowe podpowiedzi i słownictwo. Ćwicz bezpłatnie z LinguaFlow.`,
    JA: `${topic.level}レベル（${pair}）の会話質問、追加質問、語彙を収録。LinguaFlowで無料で練習できます。`,
  }[locale];
  const description = `${title}. ${topic.description[locale]} ${suffix}`;
  if (description.length <= 158) return description;
  const shortened = description.slice(0, 158);
  return `${shortened.slice(0, shortened.lastIndexOf(" ")).replace(/[.,;:!?-]+$/, "")}.`;
}

function topicTitle(topic: Topic, locale: Locale) {
  const suffix = {
    EN: "Conversation Questions",
    PL: "Pytania do rozmowy",
    JA: "会話の質問",
  }[locale];
  const maxTopicLength = locale === "JA" ? 28 : 34;
  const name =
    topic.title[locale].length > maxTopicLength
      ? `${topic.title[locale].slice(0, maxTopicLength - 1).trim()}…`
      : topic.title[locale];
  return `${name}: ${suffix}`;
}

function practiceUrl(baseUrl: string, topic: Topic) {
  const [support, target] = topic.languages;
  const params = new URLSearchParams({
    practice: topic.id,
    target,
    support,
    level: topic.level,
  });
  return `${baseUrl}/app/?${params.toString()}`;
}

function topicPage(baseUrl: string, topic: Topic, locale: Locale) {
  const copy = localeConfig[locale];
  const canonicalPath = topicPath(locale, topic);
  const canonical = `${baseUrl}${canonicalPath}`;
  const languagePair = topic.languages
    .map((language) => languageLabels[locale][language])
    .join(" ↔ ");
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonical}#page`,
        url: canonical,
        name: topic.title[locale],
        description: topic.description[locale],
        inLanguage: copy.code,
        dateModified: CONTENT_LAST_MODIFIED,
        isPartOf: { "@id": `${baseUrl}/#website` },
        mainEntity: { "@id": `${canonical}#resource` },
      },
      {
        "@type": "LearningResource",
        "@id": `${canonical}#resource`,
        name: topic.title[locale],
        description: topic.description[locale],
        inLanguage: copy.code,
        educationalLevel: topic.level,
        learningResourceType: "Conversation prompts",
        isAccessibleForFree: true,
        license: `${REPOSITORY_URL}/blob/main/LICENSE`,
        teaches: `${topic.title[locale]} conversation in ${languagePair}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: copy.home,
            item: `${baseUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: copy.allTopics,
            item: `${baseUrl}/${copy.code}/`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: topic.title[locale],
            item: canonical,
          },
        ],
      },
    ],
  };
  const questionItems = [
    topic.mainPrompt[locale],
    ...topic.followUps[locale],
  ]
    .map((question) => `<li>${escapeHtml(question)}</li>`)
    .join("");
  const vocabularyRows = topic.vocabulary[locale]
    .map(
      (item) =>
        `<tr><td><strong>${escapeHtml(item.word)}</strong></td><td>${escapeHtml(item.translation)}</td><td>${escapeHtml(item.part)}</td></tr>`,
    )
    .join("");
  const relatedTopics = topicCatalog
    .all()
    .filter((candidate) => candidate.id !== topic.id && candidate.category === topic.category)
    .slice(0, 3)
    .map(
      (candidate) => `<a class="card" href="${baseUrl}${topicPath(locale, candidate)}">
        <strong>${escapeHtml(candidate.title[locale])}</strong>
        <span>${escapeHtml(candidate.description[locale])}</span>
      </a>`,
    )
    .join("");
  const body = `${header(baseUrl, locale)}
    <main class="page">
      <p class="eyebrow">${escapeHtml(categoryCopy[topic.category][locale])}</p>
      <h1>${escapeHtml(topic.title[locale])}</h1>
      <p class="lede">${escapeHtml(topic.description[locale])}</p>
      <div class="meta">
        <span>${copy.level}: ${topic.level}</span>
        <span>${copy.languagePair}: ${escapeHtml(languagePair)}</span>
        <span>${copy.category}: ${escapeHtml(categoryCopy[topic.category][locale])}</span>
      </div>
      <section>
        <h2>${copy.mainPrompt}</h2>
        <p class="prompt">${escapeHtml(topic.mainPrompt[locale])}</p>
      </section>
      <section>
        <h2>${copy.questions}</h2>
        <ol class="questions">${questionItems}</ol>
      </section>
      <section>
        <h2>${copy.vocabulary}</h2>
        <table class="vocab">
          <thead><tr><th>${copy.word}</th><th>${copy.support}</th><th>${copy.part}</th></tr></thead>
          <tbody>${vocabularyRows}</tbody>
        </table>
      </section>
      <section>
        <h2>${copy.useTitle}</h2>
        <ol class="steps">${copy.useSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
      </section>
      ${
        relatedTopics
          ? `<section><h2>${copy.related}</h2><div class="grid">${relatedTopics}</div></section>`
          : ""
      }
      <aside class="cta">
        <strong>${copy.cta}</strong>
        <p>${escapeHtml(topic.description[locale])}</p>
        <a class="button" href="${practiceUrl(baseUrl, topic)}">${copy.cta}</a>
      </aside>
    </main>
    ${footer()}`;
  return documentShell({
    baseUrl,
    locale,
    title: topicTitle(topic, locale),
    description: topicDescription(topic, locale),
    canonicalPath,
    alternates: alternateLinks(baseUrl, topic),
    body,
    schema,
  });
}

function hubPage(baseUrl: string, locale: Locale) {
  const copy = localeConfig[locale];
  const canonicalPath = `/${copy.code}/`;
  const canonical = `${baseUrl}${canonicalPath}`;
  const cards = topicCatalog
    .all()
    .map(
      (topic) => `<a class="card" href="${baseUrl}${topicPath(locale, topic)}">
        <strong>${escapeHtml(topic.title[locale])}</strong>
        <small>${topic.level} · ${escapeHtml(categoryCopy[topic.category][locale])}</small>
        <span>${escapeHtml(topic.description[locale])}</span>
      </a>`,
    )
    .join("");
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonical}#page`,
    url: canonical,
    name: copy.hubHeading,
    description: copy.hubDescription,
    inLanguage: copy.code,
    dateModified: CONTENT_LAST_MODIFIED,
    isPartOf: { "@id": `${baseUrl}/#website` },
  };
  const body = `${header(baseUrl, locale)}
    <main class="page">
      <p class="eyebrow">LinguaFlow · ${topicCatalog.all().length} topics</p>
      <h1>${copy.hubHeading}</h1>
      <p class="lede">${copy.hubIntro}</p>
      <div class="grid">${cards}</div>
    </main>
    ${footer()}`;
  return documentShell({
    baseUrl,
    locale,
    title: copy.hubTitle,
    description: copy.hubDescription,
    canonicalPath,
    alternates: alternateLinks(baseUrl),
    body,
    schema,
    type: "website",
  });
}

function supportingPage(
  baseUrl: string,
  path: string,
  title: string,
  description: string,
  heading: string,
  content: string,
  schemaType: "AboutPage" | "WebPage",
) {
  const canonical = `${baseUrl}${path}`;
  return documentShell({
    baseUrl,
    locale: "EN",
    title,
    description,
    canonicalPath: path,
    type: "website",
    schema: {
      "@context": "https://schema.org",
      "@type": schemaType,
      "@id": `${canonical}#page`,
      url: canonical,
      name: heading,
      description,
      inLanguage: "en",
      dateModified: CONTENT_LAST_MODIFIED,
      isPartOf: { "@id": `${baseUrl}/#website` },
    },
    body: `${header(baseUrl, "EN")}
      <main class="page"><h1>${heading}</h1>${content}</main>
      ${footer()}`,
  });
}

function homepageContent() {
  const topicLinks = topicCatalog
    .all()
    .map(
      (topic) =>
        `<li><a href="${topicPath("EN", topic)}">${escapeHtml(topic.title.EN)} conversation questions</a> <span>(${topic.level})</span></li>`,
    )
    .join("");
  return `<main class="seo-fallback">
    <section>
      <p class="seo-eyebrow">Open-source language conversation platform</p>
      <h1>Conversation questions for English, Polish, and Japanese practice</h1>
      <p>LinguaFlow is a free, open-source conversation practice platform for language learners, teachers, tutors, classrooms, and language exchange partners. It turns a clear language goal into level-aware speaking prompts, follow-up questions, and useful vocabulary, so people can spend less time preparing and more time talking.</p>
      <p>The public library contains 48 human-reviewable topics and 288 guided questions across daily life, work, travel, relationships, technology, health, education, the environment, food, arts, science, and society. Every topic is available in English, Polish, and Japanese, with CEFR levels from A1 to C1.</p>
      <p><a class="button" href="/app/">Open the LinguaFlow workspace</a></p>
      <p><a href="/en/">Browse English conversation questions</a> · <a href="/pl/">Przeglądaj pytania po polsku</a> · <a href="/ja/">日本語の会話質問を見る</a></p>
    </section>
    <section>
      <h2>Speaking practice for learners</h2>
      <p>Choose your interface language, support language, target language, and current CEFR level. LinguaFlow recommends compatible topics and keeps the language you want to speak separate from the language used for explanations. Guided conversation mode presents one question at a time, while optional translations and vocabulary remain available when you need support.</p>
    </section>
    <section>
      <h2>Classroom conversation tools for teachers and students</h2>
      <p>Teachers can select a topic, language direction, and level, then share a self-paced practice link or create a synchronized live room. Students join with a short code and follow the teacher’s current question without creating an account. Live rooms expire automatically, and the platform does not collect recordings, transcripts, email addresses, passwords, advertising identifiers, or analytics cookies.</p>
      <p><a href="/teachers/">Explore LinguaFlow for teachers</a></p>
    </section>
    <section>
      <h2>Open curriculum and transparent technology</h2>
      <p>The multilingual curriculum is authored as reviewable TypeScript and validated in continuous integration. The web application is built with React and Cloudflare Workers, released under the MIT License, and designed to run without a paid application API. Contributors can inspect the questions, improve translations, add culturally thoughtful topics, report accessibility issues, or deploy their own copy.</p>
      <p><a href="/about/">About the open-source project</a> · <a href="/privacy/">Read the privacy boundary</a> · <a href="${REPOSITORY_URL}">View the source on GitHub</a></p>
    </section>
    <section>
      <h2>Free conversation topic library</h2>
      <p>Each resource below has a central prompt, five or more follow-up questions, vocabulary support, a CEFR level, and a direct practice link. These crawlable pages make the teaching material easy to discover by topic while the interactive workspace remains focused and private.</p>
      <ul>${topicLinks}</ul>
    </section>
  </main>`;
}

function homepageSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: `${baseUrl}/`,
        name: "LinguaFlow",
        description:
          "Open-source conversation practice for English, Polish, and Japanese learners, teachers, and classrooms.",
        inLanguage: ["en", "pl", "ja"],
      },
      {
        "@type": "WebApplication",
        "@id": `${baseUrl}/#application`,
        name: "LinguaFlow",
        url: `${baseUrl}/`,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires a modern web browser",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: 0,
          priceCurrency: "USD",
        },
        featureList: [
          "48 multilingual conversation topics",
          "English, Polish, and Japanese interface and prompts",
          "CEFR levels A1 through C1",
          "Self-paced practice links",
          "Synchronized teacher-led rooms",
        ],
        license: `${REPOSITORY_URL}/blob/main/LICENSE`,
        codeRepository: REPOSITORY_URL,
      },
    ],
  };
}

function homepagePage(baseUrl: string) {
  const description =
    "Practise English, Polish, and Japanese with 48 free CEFR-level conversation topics, guided questions, vocabulary, and live teacher rooms.";
  return documentShell({
    baseUrl,
    locale: "EN",
    title: "Language Conversation Practice | LinguaFlow",
    description,
    canonicalPath: "/",
    type: "website",
    alternates: alternateLinks(baseUrl),
    schema: homepageSchema(baseUrl),
    body: `${header(baseUrl, "EN")}${homepageContent()}${footer()}`,
  });
}

function workspacePage(index: string, baseUrl: string) {
  return index
    .replace(
      /<meta\s+name="robots"[\s\S]*?\/>/i,
      '<meta name="robots" content="noindex, follow" />',
    )
    .replace(
      /<link rel="canonical" href="[^"]+" \/>/,
      `<link rel="canonical" href="${baseUrl}/" />`,
    )
    .replace(/\s*<link rel="alternate"[^>]+\/>/g, "")
    .replace(
      /<title>[^<]+<\/title>/,
      "<title>LinguaFlow Workspace</title>",
    )
    .replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      "",
    );
}

async function writeOutput(path: string, content: string) {
  const outputPath = resolve(OUTPUT_DIR, path);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, "utf8");
}

function sitemap(baseUrl: string) {
  const simplePaths = ["/", "/about/", "/privacy/", "/teachers/"];
  const entries = [
    ...simplePaths.map(
      (path) => `<url><loc>${baseUrl}${path}</loc><lastmod>${CONTENT_LAST_MODIFIED}</lastmod></url>`,
    ),
    ...locales.map((locale) => {
      const alternates = alternateLinks(baseUrl).replaceAll(
        '<link rel="alternate"',
        '<xhtml:link rel="alternate"',
      );
      return `<url><loc>${baseUrl}/${localeConfig[locale].code}/</loc><lastmod>${CONTENT_LAST_MODIFIED}</lastmod>${alternates}</url>`;
    }),
    ...topicCatalog.all().flatMap((topic) =>
      locales.map((locale) => {
        const alternates = alternateLinks(baseUrl, topic).replaceAll(
          '<link rel="alternate"',
          '<xhtml:link rel="alternate"',
        );
        return `<url><loc>${baseUrl}${topicPath(locale, topic)}</loc><lastmod>${CONTENT_LAST_MODIFIED}</lastmod>${alternates}</url>`;
      }),
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>`;
}

export function seoStaticPages(baseUrlValue: string): Plugin {
  const baseUrl = cleanBaseUrl(baseUrlValue);
  return {
    name: "linguaflow-seo-static-pages",
    enforce: "pre",
    transformIndexHtml(html) {
      return html
        .replaceAll("__PUBLIC_SITE_URL__", baseUrl)
        .replace("<!-- SEO_STATIC_CONTENT -->", "")
        .replace("__HOMEPAGE_SCHEMA__", jsonLd(homepageSchema(baseUrl)));
    },
    async closeBundle() {
      const builtIndexPath = resolve(OUTPUT_DIR, "index.html");
      const builtIndex = await readFile(builtIndexPath, "utf8");
      await writeOutput("app/index.html", workspacePage(builtIndex, baseUrl));
      await writeOutput("index.html", homepagePage(baseUrl));

      for (const locale of locales) {
        await writeOutput(
          `${localeConfig[locale].code}/index.html`,
          hubPage(baseUrl, locale),
        );
        for (const topic of topicCatalog.all()) {
          await writeOutput(
            `${localeConfig[locale].code}/topics/${topic.id}/index.html`,
            topicPage(baseUrl, topic, locale),
          );
        }
      }

      await writeOutput(
        "about/index.html",
        supportingPage(
          baseUrl,
          "/about/",
          "About LinguaFlow | Open-Source Language Practice",
          "Learn how LinguaFlow’s open-source, multilingual conversation curriculum is built, reviewed, licensed, and maintained for learners and teachers.",
          "About LinguaFlow",
          `<p class="lede">LinguaFlow is an open-source language conversation platform maintained by RobTar97 and community contributors. Its purpose is simple: make thoughtful speaking practice easier to start, adapt, inspect, and share.</p>
          <h2>What the project publishes</h2><p>The repository contains the complete English, Polish, and Japanese curriculum, topic metadata, interface translations, learner and teacher flows, accessibility behavior, security boundaries, and deployment configuration. The current library has 48 topics, 288 guided questions, 723 vocabulary entries, 12 visual categories, and CEFR coverage from A1 through C1.</p>
          <h2>How quality is maintained</h2><p>Conversation content is human-reviewable source data rather than hidden generated output. Automated checks validate language coverage, question counts, vocabulary completeness, unique identifiers, security patterns, production types, and performance budgets. Translation drafts may use tools, but the contribution guide asks proficient speakers to review naturalness, cultural context, ambiguity, and level.</p>
          <h2>Ownership, licensing, and contact</h2><p>LinguaFlow is released under the MIT License. Governance, security reporting, contribution expectations, architectural decisions, and release history are public in the source repository. Questions and non-sensitive feedback can be opened in GitHub issues. Security vulnerabilities should use GitHub private vulnerability reporting instead of a public issue.</p>
          <p><a href="${REPOSITORY_URL}">Inspect the source repository and project history</a>.</p>`,
          "AboutPage",
        ),
      );
      await writeOutput(
        "privacy/index.html",
        supportingPage(
          baseUrl,
          "/privacy/",
          "LinguaFlow Privacy | Local Preferences and Temporary Rooms",
          "Understand what LinguaFlow stores locally, what temporary classroom rooms contain, what it does not collect, and how self-hosters control deployment data.",
          "Privacy at LinguaFlow",
          `<p class="lede">LinguaFlow is designed to support conversation practice without collecting the conversation. The public application does not require an account and does not include advertising or analytics SDKs.</p>
          <h2>Information kept in your browser</h2><p>Your display name, role, interface language, support language, target language, CEFR level, saved topic identifiers, active-room state, and sound preference are stored in the current browser. Clearing site data removes those local preferences. Self-paced practice links contain only the selected topic, language direction, and level.</p>
          <h2>Temporary live-room information</h2><p>A teacher-created room stores a short access code, room name, teacher display name, topic selection, language choices, current question index, and participant display names and statuses. Production rooms expire after eight hours and can be ended earlier by the teacher. Room codes are classroom access codes, not identity authentication, so participants should use first names, initials, or classroom nicknames.</p>
          <h2>Information the application does not collect</h2><p>LinguaFlow does not collect audio, video, conversation transcripts, email addresses, passwords, precise location, payment data, advertising identifiers, or analytics cookies. The deployed infrastructure may process ordinary request metadata such as IP addresses temporarily for delivery, security, and rate limiting. Self-hosted operators are responsible for their own infrastructure logs and institutional policies.</p>
          <h2>Open implementation</h2><p>The storage boundaries, room expiration, API validation, and security headers are documented in the public repository. This page describes the default project; an independent deployment may add services with different practices and should publish its own notice.</p>`,
          "WebPage",
        ),
      );
      await writeOutput(
        "teachers/index.html",
        supportingPage(
          baseUrl,
          "/teachers/",
          "Free Conversation Questions for Language Teachers | LinguaFlow",
          "Prepare English, Polish, and Japanese speaking lessons with free CEFR-level conversation questions, practice links, and synchronized classroom rooms.",
          "Conversation questions and live rooms for language teachers",
          `<p class="lede">LinguaFlow gives language teachers a searchable library of CEFR-level conversation material and two simple ways to share it: independent practice links and synchronized live rooms.</p>
          <h2>Prepare a speaking activity</h2><p>Choose one of 48 real-life topics, set the support and target languages, and select a level from A1 to C1. Each topic includes a central question, at least five follow-up prompts, and five or six vocabulary items. Search covers titles, descriptions, questions, and vocabulary in English, Polish, and Japanese.</p>
          <h2>Send self-paced conversation practice</h2><p>A practice link preserves the topic, language direction, and CEFR level without creating a shared learner record. Each student moves through the questions independently. This is useful for homework, tutoring preparation, language exchange, and groups working at different speeds.</p>
          <h2>Guide a synchronized classroom room</h2><p>Create a room, share its short code or invite link, and advance one question for everyone. Students join with a display name and do not need an account. Temporary connection loss falls back to periodic refresh, and rooms expire after eight hours. The teacher can end a room immediately.</p>
          <h2>Adapt and contribute</h2><p>The curriculum and application are open source under the MIT License. Teachers can review every prompt, propose clearer level calibration, improve translations, add culturally relevant topics, or deploy an independent copy for their community.</p>
          <p><a class="button" href="${baseUrl}/app/">Open the teacher workspace</a></p>`,
          "WebPage",
        ),
      );
      await writeOutput(
        "404.html",
        `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Page not found | LinguaFlow</title><style>${staticStyles()}</style></head><body>${header(baseUrl, "EN")}<main class="page"><h1>Page not found</h1><p class="lede">This address does not match a LinguaFlow topic or application page.</p><p><a class="button" href="${baseUrl}/">Return to LinguaFlow</a></p></main>${footer()}</body></html>`,
      );
      await writeOutput("sitemap.xml", sitemap(baseUrl));
      await writeOutput(
        "robots.txt",
        `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`,
      );
      await writeOutput(
        "llms.txt",
        `# LinguaFlow\n> Open-source, account-free conversation practice for English, Polish, and Japanese learners, teachers, and classrooms.\n\n## Main pages\n- [Application](${baseUrl}/): Interactive learner, teacher, and student workspace.\n- [English conversation questions](${baseUrl}/en/): 48 CEFR-level topic resources in English.\n- [Polish conversation questions](${baseUrl}/pl/): 48 CEFR-level topic resources in Polish.\n- [Japanese conversation questions](${baseUrl}/ja/): 48 CEFR-level topic resources in Japanese.\n- [Teacher guide](${baseUrl}/teachers/): Self-paced links and synchronized live rooms.\n- [About](${baseUrl}/about/): Project ownership, curriculum, review process, and license.\n- [Privacy](${baseUrl}/privacy/): Local storage and temporary-room data boundaries.\n- [Source code](${REPOSITORY_URL}): MIT-licensed implementation and authored curriculum.\n\n## Key facts\n- 48 conversation topics and 288 guided questions.\n- English, Polish, and Japanese content and interface copy.\n- CEFR levels A1, A2, B1, B2, and C1.\n- No account, advertising SDK, analytics cookie, audio recording, or transcript collection in the default project.\n- Live rooms expire after eight hours and can be ended by the teacher.\n- Content last reviewed: ${CONTENT_LAST_MODIFIED}.\n`,
      );

      const index = await readFile(builtIndexPath, "utf8");
      if (index.includes("__PUBLIC_SITE_URL__") || index.includes("__HOMEPAGE_SCHEMA__")) {
        throw new Error("SEO placeholders remain in the built homepage.");
      }
    },
  };
}
