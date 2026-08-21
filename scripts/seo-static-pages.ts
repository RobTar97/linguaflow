import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";
import { topicCatalog } from "../src/catalog/topicCatalog";
import { categoryCopy } from "../src/content/topics";
import type { Locale, Topic } from "../src/domain/types";

const OUTPUT_DIR = resolve("dist");
const CONTENT_LAST_MODIFIED = "2026-08-04";
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
    :root{color:#10213b;background:#f7f9ff;font:16px/1.6 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f7f9ff}a{color:#244bd8;text-underline-offset:.18em}a:hover{text-decoration-thickness:2px}
    .page{width:min(1120px,calc(100% - 32px));margin:auto}.site-header,.site-footer{display:flex;gap:20px;align-items:center;justify-content:space-between;padding:22px 0}
    .site-header{position:relative;z-index:10}.brand{color:#10213b;font-size:1.25rem;font-weight:850;letter-spacing:-.04em;text-decoration:none}.brand span{color:#d94727}
    nav{display:flex;gap:6px;align-items:center;flex-wrap:wrap}nav a{min-height:44px;padding:10px 12px;border-radius:999px;color:#394760;font-size:.9rem;font-weight:650;text-decoration:none}nav a:hover{color:#10213b;background:#eaf0ff}main{padding:42px 0 64px}.eyebrow{color:#355dff;font-size:.75rem;font-weight:850;letter-spacing:.1em;text-transform:uppercase}
    h1{max-width:850px;margin:.2em 0;font-size:clamp(2rem,6vw,4.3rem);line-height:1.05;letter-spacing:-.04em}h2{margin-top:2.4rem;line-height:1.2}
    .lede{max-width:760px;color:#536078;font-size:1.15rem}.feature-visual{display:block;width:100%;height:auto;margin:28px 0;border:1px solid #dfe6f5;border-radius:24px;background:#fff;box-shadow:0 16px 42px rgba(26,45,90,.08)}.topic-visual{width:min(100%,544px)}.meta,.card,.prompt,.cta{border:1px solid #dfe6f5;border-radius:18px;background:#fff;box-shadow:0 10px 32px rgba(26,45,90,.05)}
    .meta{display:flex;gap:12px;flex-wrap:wrap;padding:14px 18px}.meta span{font-weight:700}.prompt{padding:22px;font-size:1.15rem}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}.card{display:block;padding:18px;color:inherit;text-decoration:none}.card:hover{border-color:#d46a50}
    .card strong{display:block;margin-bottom:6px}.card small{color:#667177}.questions li,.steps li{margin:.65rem 0}.vocab{width:100%;border-collapse:collapse}.vocab th,.vocab td{padding:10px;border-bottom:1px solid #e5dfd8;text-align:left}
    .cta{margin-top:32px;padding:24px}.button{display:inline-flex;min-height:48px;align-items:center;justify-content:center;margin-top:10px;padding:12px 18px;border-radius:14px;color:#fff;background:#355dff;font-weight:800;text-decoration:none;box-shadow:0 8px 22px rgba(53,93,255,.22);transition:transform 140ms ease,box-shadow 140ms ease}.button:hover{box-shadow:0 12px 28px rgba(53,93,255,.28);transform:translateY(-1px)}.button:active{transform:scale(.975)}
    .site-footer{border-top:1px solid #dfe6f5;color:#66728a;font-size:.9rem}@media(max-width:640px){.site-header,.site-footer{align-items:flex-start;flex-direction:column}.site-header nav{width:100%;overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px}.site-header nav a{white-space:nowrap}main{padding-top:24px}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.button{transition:none}.button:hover,.button:active{transform:none}}
  `;
}

function homepageStyles() {
  return `
    .home{padding-top:20px}.home section{scroll-margin-top:24px}.home-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(390px,.9fr);gap:clamp(38px,6vw,86px);align-items:center;min-height:660px;padding:42px 0 74px}.home-hero-copy{position:relative;z-index:2}.home-hero .eyebrow{display:inline-flex;align-items:center;gap:8px;margin:0 0 18px;padding:7px 11px;border:1px solid #cfdbff;border-radius:999px;background:#eef3ff}.home-hero .eyebrow:before{width:7px;height:7px;border-radius:50%;background:#ff6b4a;box-shadow:0 0 0 4px #ffe5de;content:""}.home h1{max-width:700px;margin:0;color:#10213b;font-family:ui-rounded,"Avenir Next Rounded","Avenir Next",system-ui,sans-serif;font-size:clamp(3.25rem,7vw,6.4rem);font-weight:850;line-height:.92;letter-spacing:-.075em}.home h1 span{color:#355dff}.home-hero-copy>.lede{max-width:610px;margin:25px 0 0;font-size:clamp(1.05rem,1.4vw,1.22rem);line-height:1.7}.home-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:30px}.home-actions .button{margin:0;padding-inline:22px}.button-secondary{display:inline-flex;min-height:48px;align-items:center;justify-content:center;padding:11px 18px;border:1px solid #cbd6ed;border-radius:14px;color:#10213b;background:rgba(255,255,255,.72);font-weight:750;text-decoration:none;transition:transform 140ms ease,background 140ms ease,border-color 140ms ease}.button-secondary:hover{border-color:#9db2e6;background:#fff;transform:translateY(-1px)}.button-secondary:active{transform:scale(.975)}.home-trust{display:flex;gap:16px;flex-wrap:wrap;margin:24px 0 0;padding:0;list-style:none;color:#65718a;font-size:.86rem;font-weight:650}.home-trust li{display:flex;align-items:center;gap:6px}.home-trust li:before{width:5px;height:5px;border-radius:50%;background:#40b88a;content:""}
    .conversation-stage{position:relative;min-height:560px;isolation:isolate}.conversation-stage:before{position:absolute;inset:6% -4% 0;border-radius:46% 54% 40% 60%/56% 40% 60% 44%;background:linear-gradient(145deg,#dfe8ff,#c9f3e3);content:""}.conversation-window{position:absolute;inset:68px 4px 44px 26px;overflow:hidden;border:1px solid rgba(255,255,255,.8);border-radius:30px;background:#fff;box-shadow:0 34px 70px rgba(28,52,108,.2);transform:rotate(1.5deg)}.conversation-window img{width:100%;height:100%;display:block;object-fit:cover}.conversation-window:after{position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(16,33,59,.12));content:""}.prompt-chip{position:absolute;z-index:2;max-width:240px;padding:13px 16px;border:1px solid rgba(255,255,255,.88);border-radius:17px;background:rgba(255,255,255,.88);box-shadow:0 15px 34px rgba(20,43,96,.16);font-weight:780;line-height:1.35;backdrop-filter:blur(15px);animation:chip-arrive 650ms cubic-bezier(.16,1,.3,1) both}.prompt-chip small{display:block;margin-bottom:2px;color:#66728a;font-size:.66rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.prompt-en{top:18px;right:6px;animation-delay:100ms}.prompt-pl{bottom:4px;left:0;animation-delay:180ms}.prompt-ja{top:42%;right:-18px;animation-delay:260ms}.prompt-ja strong{font-size:1.08rem}.home-proof{display:grid;grid-template-columns:repeat(4,1fr);border-block:1px solid #dbe3f3}.proof-item{padding:25px 18px;text-align:center}.proof-item+.proof-item{border-inline-start:1px solid #dbe3f3}.proof-item strong{display:block;color:#10213b;font-size:1.75rem;line-height:1.1;letter-spacing:-.04em}.proof-item span{color:#5f6b82;font-size:.84rem;font-weight:650}
    .home-section{padding:96px 0}.section-heading{display:grid;grid-template-columns:minmax(0,.8fr) minmax(300px,.55fr);gap:48px;align-items:end;margin-bottom:34px}.section-heading h2{max-width:650px;margin:6px 0 0;color:#10213b;font-size:clamp(2rem,4vw,3.5rem);line-height:1.02;letter-spacing:-.055em}.section-heading>p{margin:0;color:#5f6c84}.path-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.path-card{position:relative;min-height:270px;padding:26px;border:1px solid #dbe4f5;border-radius:24px;background:#fff;box-shadow:0 14px 38px rgba(26,45,90,.06);transition:transform 180ms cubic-bezier(.16,1,.3,1),box-shadow 180ms ease,border-color 180ms ease}.path-card:hover{border-color:#b8c9f3;box-shadow:0 20px 46px rgba(26,45,90,.12);transform:translateY(-4px)}.path-label{display:inline-flex;padding:5px 9px;border-radius:999px;color:#244bd8;background:#edf2ff;font-size:.72rem;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.path-card h3{margin:44px 0 10px;font-size:1.55rem;line-height:1.1;letter-spacing:-.035em}.path-card p{margin:0;color:#637088}.path-card a{position:absolute;inset-inline:26px;bottom:24px;font-weight:780;text-decoration:none}.path-card a:after{content:" →"}.path-card:nth-child(2){background:#10213b;color:#fff}.path-card:nth-child(2) .path-label{color:#dce6ff;background:#253857}.path-card:nth-child(2) p{color:#bdc9dd}.path-card:nth-child(2) a{color:#bcd0ff}
    .sample-section{display:grid;grid-template-columns:minmax(0,.8fr) minmax(360px,1fr);gap:clamp(40px,7vw,90px);align-items:center;padding:80px clamp(28px,5vw,64px);border-radius:34px;background:#10213b;color:#fff}.sample-section h2{margin:8px 0 18px;font-size:clamp(2rem,4vw,3.5rem);line-height:1.03;letter-spacing:-.05em}.sample-section p{color:#c1ccde}.sample-section .eyebrow{color:#8eabff}.sample-deck{position:relative;min-height:400px}.sample-card{position:absolute;inset:36px 8px 24px 34px;display:flex;flex-direction:column;justify-content:space-between;padding:30px;border-radius:25px;background:#fff;color:#10213b;box-shadow:0 30px 70px rgba(0,0,0,.3);transform:rotate(2deg)}.sample-card:before,.sample-card:after{position:absolute;inset:0;border-radius:25px;background:#dce7ff;content:"";transform:rotate(-7deg) translate(-16px,8px);z-index:-1}.sample-card:after{background:#ffcfbf;transform:rotate(7deg) translate(18px,4px);z-index:-2}.sample-meta{display:flex;justify-content:space-between;color:#6a7690;font-size:.75rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.sample-question{margin:auto 0;font-family:ui-rounded,"Avenir Next Rounded",system-ui,sans-serif;font-size:clamp(1.55rem,3vw,2.35rem);font-weight:800;line-height:1.18;letter-spacing:-.04em}.sample-support{padding-top:16px;border-top:1px solid #e5eaf5;color:#5f6c84;font-size:.94rem}.sample-note{margin-top:18px;color:#9dacbf;font-size:.86rem}
    .curriculum-section{padding-bottom:72px}.topic-directory{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:28px 0 0;padding:0;list-style:none}.topic-directory li{min-width:0}.topic-directory a{display:flex;min-height:52px;align-items:center;justify-content:space-between;gap:12px;padding:10px 13px;border:1px solid #dfe6f4;border-radius:13px;color:#24334f;background:#fff;font-size:.88rem;font-weight:650;text-decoration:none;transition:border-color 140ms ease,transform 140ms ease}.topic-directory a:hover{border-color:#9db2e6;transform:translateY(-1px)}.topic-directory span{flex:0 0 auto;padding:2px 7px;border-radius:999px;color:#244bd8;background:#edf2ff;font-size:.7rem}.open-section{display:grid;grid-template-columns:minmax(0,.8fr) minmax(300px,.55fr);gap:48px;align-items:center;margin-bottom:80px;padding:38px;border:1px solid #dbe4f4;border-radius:28px;background:linear-gradient(135deg,#fff,#edf3ff)}.open-section h2{margin:5px 0 12px;font-size:clamp(1.8rem,3vw,2.7rem);letter-spacing:-.045em}.open-links{display:flex;gap:9px;flex-wrap:wrap}.open-links a{min-height:44px;padding:9px 12px;border:1px solid #cad6ee;border-radius:12px;background:#fff;font-size:.86rem;font-weight:720;text-decoration:none}
    @keyframes chip-arrive{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}@media(max-width:900px){.home-hero{grid-template-columns:1fr;min-height:0;padding-top:52px}.conversation-stage{min-height:520px;max-width:650px;width:100%;margin:auto}.home-proof{grid-template-columns:repeat(2,1fr)}.proof-item:nth-child(3){border-inline-start:0;border-top:1px solid #dbe3f3}.proof-item:nth-child(4){border-top:1px solid #dbe3f3}.section-heading,.open-section{grid-template-columns:1fr;gap:18px}.path-grid{grid-template-columns:1fr}.path-card{min-height:230px}.sample-section{grid-template-columns:1fr}.topic-directory{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.site-header nav a:nth-last-child(-n+2){display:none}}@media(max-width:560px){.home{width:100%;overflow:hidden}.home-hero,.home-section,.curriculum-section,.open-section{width:calc(100% - 32px);margin-inline:auto}.home-hero{padding:34px 0 52px}.home h1{font-size:clamp(3.1rem,15vw,4.2rem)}.home h1 span{display:block}.home-actions{align-items:stretch}.home-actions a{width:100%}.home-trust{gap:8px 14px}.conversation-stage{min-height:390px}.conversation-window{inset:58px 8px 40px 8px;border-radius:23px}.prompt-chip{max-width:190px;padding:10px 12px;font-size:.8rem}.prompt-en{right:0}.prompt-ja{right:0}.prompt-pl{left:0}.home-proof{width:100%;grid-template-columns:repeat(2,1fr)}.proof-item{padding:20px 8px}.proof-item strong{font-size:1.45rem}.home-section{padding:72px 0}.section-heading{margin-bottom:24px}.path-card{padding:22px}.sample-section{width:calc(100% - 24px);padding:54px 20px;border-radius:26px}.sample-deck{min-height:360px}.sample-card{inset:28px 2px 20px 10px;padding:24px}.topic-directory{grid-template-columns:1fr}.open-section{margin-bottom:56px;padding:26px 22px}.site-footer{width:calc(100% - 32px)}}@media(prefers-reduced-motion:reduce){.prompt-chip{animation:none}.path-card,.topic-directory a,.button-secondary{transition:none}.path-card:hover,.topic-directory a:hover,.button-secondary:hover,.button-secondary:active{transform:none}}
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
  image?: { path: string; alt: string; width: number; height: number };
  twitterCard?: "summary" | "summary_large_image";
  styles?: string;
}) {
  const { baseUrl, locale, title, description, canonicalPath, body, schema } =
    options;
  const canonical = `${baseUrl}${canonicalPath}`;
  const image = options.image ?? {
    path: "/og-image-v2.jpg",
    alt: "LinguaFlow multilingual conversation practice workspace",
    width: 1280,
    height: 640,
  };
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
    <meta property="og:image" content="${baseUrl}${image.path}" />
    <meta property="og:image:width" content="${image.width}" />
    <meta property="og:image:height" content="${image.height}" />
    <meta property="og:image:alt" content="${escapeHtml(image.alt)}" />
    <meta name="twitter:card" content="${options.twitterCard ?? "summary_large_image"}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${baseUrl}${image.path}" />
    <meta name="twitter:image:alt" content="${escapeHtml(image.alt)}" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <title>${escapeHtml(title)}</title>
    <style>${staticStyles()}${options.styles ?? ""}</style>
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

function topicImagePath(topic: Topic) {
  return `/images/topics/atlas-${topic.atlas ?? 1}-${topic.artIndex}.jpg`;
}

function topicPage(baseUrl: string, topic: Topic, locale: Locale) {
  const copy = localeConfig[locale];
  const canonicalPath = topicPath(locale, topic);
  const canonical = `${baseUrl}${canonicalPath}`;
  const imagePath = topicImagePath(topic);
  const imageUrl = `${baseUrl}${imagePath}`;
  const imageAlt = {
    EN: `${topic.title.EN} conversation topic illustration`,
    PL: `Ilustracja tematu rozmowy: ${topic.title.PL}`,
    JA: `${topic.title.JA}の会話トピックのイラスト`,
  }[locale];
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
        primaryImageOfPage: { "@id": `${canonical}#image` },
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
        image: imageUrl,
      },
      {
        "@type": "ImageObject",
        "@id": `${canonical}#image`,
        contentUrl: imageUrl,
        caption: imageAlt,
        width: 362,
        height: 362,
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
      <img class="feature-visual topic-visual" src="${imagePath}" width="362" height="362" alt="${escapeHtml(imageAlt)}" loading="eager" fetchpriority="high" />
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
    image: { path: imagePath, alt: imageAlt, width: 362, height: 362 },
    twitterCard: "summary",
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
  image?: { path: string; alt: string; width: number; height: number },
) {
  const canonical = `${baseUrl}${path}`;
  return documentShell({
    baseUrl,
    locale: "EN",
    title,
    description,
    canonicalPath: path,
    type: "website",
    image,
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
        `<li><a href="${topicPath("EN", topic)}"><strong>${escapeHtml(topic.title.EN)}</strong><span>${topic.level}</span></a></li>`,
    )
    .join("");
  return `<main class="page home seo-fallback">
    <section class="home-hero" aria-labelledby="home-heading">
      <div class="home-hero-copy">
        <p class="eyebrow">Open-source conversation practice</p>
        <h1 id="home-heading">Find the words. <span>Keep talking.</span></h1>
        <p class="lede">LinguaFlow turns a language goal into thoughtful prompts, useful vocabulary, and guided conversation—so learners and teachers can spend less time preparing and more time speaking.</p>
        <div class="home-actions">
          <a class="button" href="/app/">Start a conversation&nbsp; →</a>
          <a class="button-secondary" href="#topic-library">Explore 48 free topics</a>
        </div>
        <ul class="home-trust" aria-label="Product highlights">
          <li>No account</li><li>Free and open source</li><li>English · Polski · 日本語</li>
        </ul>
      </div>
      <div class="conversation-stage" aria-label="A multilingual conversation in progress">
        <div class="conversation-window">
          <picture>
            <source media="(max-width: 720px)" srcset="/images/linguaflow-guided-session-720.webp" />
            <img src="/images/linguaflow-guided-session-1200.webp" width="1200" height="675" alt="A teacher guiding three adult learners through a friendly online conversation" loading="eager" fetchpriority="high" decoding="async" />
          </picture>
        </div>
        <div class="prompt-chip prompt-en"><small>English · B1</small>What makes a conversation memorable?</div>
        <div class="prompt-chip prompt-pl"><small>Polski · wsparcie</small>Co sprawia, że rozmowę pamiętasz?</div>
        <div class="prompt-chip prompt-ja" lang="ja"><small>日本語 · 会話</small><strong>話してみよう</strong></div>
      </div>
    </section>
    <section class="home-proof" aria-label="LinguaFlow curriculum at a glance">
      <div class="proof-item"><strong>48</strong><span>real-life topics</span></div>
      <div class="proof-item"><strong>288</strong><span>guided questions</span></div>
      <div class="proof-item"><strong>3</strong><span>complete languages</span></div>
      <div class="proof-item"><strong>A1–C1</strong><span>CEFR levels</span></div>
    </section>
    <section class="home-section" aria-labelledby="choose-path-heading">
      <div class="section-heading">
        <div><p class="eyebrow">One shared curriculum</p><h2 id="choose-path-heading">A clearer path into every conversation.</h2></div>
        <p>Choose the way you want to practise. Every path uses the same level-aware questions and keeps support available without interrupting the flow.</p>
      </div>
      <div class="path-grid">
        <article class="path-card"><span class="path-label">For learners</span><h3>Speak at your own pace</h3><p>Choose your target language and CEFR level, then move through one focused prompt at a time with optional translations and vocabulary.</p><a href="/app/">Begin independent practice</a></article>
        <article class="path-card"><span class="path-label">For teachers</span><h3>Lead the room, not the software</h3><p>Prepare a topic, share a short code, and move the whole class through questions, pauses, reflection, and completion together.</p><a href="/teachers/">Explore teacher tools</a></article>
        <article class="path-card"><span class="path-label">For students</span><h3>Join without an account</h3><p>Enter a room code and stay synchronized with the teacher’s current prompt. No email address, password, recording, or transcript required.</p><a href="/app/">Join a live room</a></article>
      </div>
    </section>
    <section class="sample-section" aria-labelledby="guided-heading">
      <div>
        <p class="eyebrow">Guidance when you need it</p>
        <h2 id="guided-heading">One good question can unlock the room.</h2>
        <p>Guided conversation mode keeps attention on the current prompt instead of a crowded worksheet. Reveal support only when it helps, move naturally into follow-up questions, and keep useful vocabulary close enough to reach without taking over the discussion.</p>
        <p class="sample-note">Language direction stays explicit: the language you want to speak is separate from the language used for support.</p>
      </div>
      <div class="sample-deck" aria-label="Example guided conversation card">
        <article class="sample-card">
          <div class="sample-meta"><span>Remote work</span><span>B2 · Question 2 of 6</span></div>
          <p class="sample-question">What helps people feel connected when they work far apart?</p>
          <p class="sample-support">Support is available in English, Polish, or Japanese—without replacing the question you are practising.</p>
        </article>
      </div>
    </section>
    <section class="home-section curriculum-section" id="topic-library" aria-labelledby="library-heading">
      <div class="section-heading">
        <div><p class="eyebrow">The free conversation library</p><h2 id="library-heading">Start with something worth talking about.</h2></div>
        <p>The public curriculum covers daily life, work, travel, relationships, technology, health, education, the environment, food, arts, science, and society. Every topic includes a central prompt, at least five follow-up questions, vocabulary support, and a direct practice link.</p>
      </div>
      <p><a href="/en/">Browse in English</a> · <a href="/pl/">Przeglądaj po polsku</a> · <a href="/ja/" lang="ja">日本語で見る</a></p>
      <ul class="topic-directory">${topicLinks}</ul>
    </section>
    <section class="open-section" aria-labelledby="open-heading">
      <div><p class="eyebrow">Open by design</p><h2 id="open-heading">The curriculum is inspectable, portable, and yours to improve.</h2><p>LinguaFlow publishes its multilingual curriculum as human-reviewable source data. Versioned topic packs carry license, authorship, compatibility, facilitation notes, and review assertions. Contributors can validate a pack in the browser before sharing it, while learners keep private notes and saved material on their own device.</p></div>
      <div class="open-links"><a href="/app/?contribute=1">Preview a topic pack</a><a href="/about/">About the project</a><a href="/privacy/">Privacy boundaries</a><a href="${REPOSITORY_URL}">Source on GitHub</a></div>
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
    styles: homepageStyles(),
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
      `<link rel="canonical" href="${baseUrl}/app/" />`,
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
          <h2>How quality is maintained</h2><p>Conversation content is human-reviewable source data rather than hidden generated output. Automated checks validate language coverage, question counts, vocabulary completeness, unique identifiers, pack safety, security patterns, production types, and performance budgets. Portable packs expose authorship, license, source, compatibility, and factual review assertions; missing review is shown openly as unreviewed.</p>
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
          <h2>Information kept in your browser</h2><p>Your display name, role, interface language, support language, target language, CEFR level, saved topic identifiers, private topic notes, vocabulary bookmarks, installed topic packs, active-room state, and sound preference are stored in the current browser. You can export the learner-owned portion as versioned JSON and preview a merge before importing it elsewhere. Room history and access tokens are excluded. Clearing site data removes local preferences and installed packs.</p>
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
          <picture><source media="(max-width: 720px)" srcset="/images/linguaflow-guided-session-720.webp" /><img class="feature-visual" src="/images/linguaflow-guided-session-1200.webp" width="1200" height="675" alt="A language teacher guiding three adult learners through a structured online conversation session" loading="eager" fetchpriority="high" decoding="async" /></picture>
          <h2>Prepare a speaking activity</h2><p>Choose one of 48 real-life topics or an installed portable topic pack, set the support and target languages, and select a level from A1 to C1. Each core topic includes a central question, at least five follow-up prompts, vocabulary, timing, objectives, warm-up guidance, and difficulty adaptations. Lesson notes have a print layout and installed content remains available during low connectivity.</p>
          <h2>Send self-paced conversation practice</h2><p>A practice link preserves the topic, language direction, and CEFR level without creating a shared learner record. Each student moves through the questions independently. This is useful for homework, tutoring preparation, language exchange, and groups working at different speeds.</p>
          <h2>Guide a synchronized classroom room</h2><p>Create a room, share its short code or invite link, and advance one question for everyone. Students join with a display name and do not need an account. Temporary connection loss falls back to periodic refresh, and rooms expire after eight hours. The teacher can end a room immediately.</p>
          <h2>Adapt and contribute</h2><p>The curriculum and application are open source under the MIT License. Teachers can review every prompt, propose clearer level calibration, improve translations, add culturally relevant topics, or deploy an independent copy for their community.</p>
          <p><a class="button" href="${baseUrl}/app/">Open the teacher workspace</a></p>`,
          "WebPage",
          {
            path: "/images/linguaflow-guided-session-1200.webp",
            alt: "A language teacher guiding three adult learners through a structured online conversation session",
            width: 1200,
            height: 675,
          },
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
        `# LinguaFlow\n> Open-source, account-free conversation practice for English, Polish, and Japanese learners, teachers, and classrooms.\n\n## Main pages\n- [Public homepage](${baseUrl}/): Searchable project overview and curriculum directory.\n- [Interactive workspace](${baseUrl}/app/): Learner, teacher, and student workspace (not indexed).\n- [English conversation questions](${baseUrl}/en/): 48 CEFR-level topic resources in English.\n- [Polish conversation questions](${baseUrl}/pl/): 48 CEFR-level topic resources in Polish.\n- [Japanese conversation questions](${baseUrl}/ja/): 48 CEFR-level topic resources in Japanese.\n- [Teacher guide](${baseUrl}/teachers/): Self-paced links and synchronized live rooms.\n- [About](${baseUrl}/about/): Project ownership, curriculum, review process, and license.\n- [Privacy](${baseUrl}/privacy/): Local storage and temporary-room data boundaries.\n- [Source code](${REPOSITORY_URL}): MIT-licensed implementation and authored curriculum.\n\n## Key facts\n- 48 conversation topics and 288 guided questions.\n- English, Polish, and Japanese content and interface copy.\n- CEFR levels A1, A2, B1, B2, and C1.\n- No account, advertising SDK, analytics cookie, audio recording, or transcript collection in the default project.\n- Live rooms expire after eight hours and can be ended by the teacher.\n- Content last reviewed: ${CONTENT_LAST_MODIFIED}.\n`,
      );

      const index = await readFile(builtIndexPath, "utf8");
      if (index.includes("__PUBLIC_SITE_URL__") || index.includes("__HOMEPAGE_SCHEMA__")) {
        throw new Error("SEO placeholders remain in the built homepage.");
      }
    },
  };
}
