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
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f7f9ff}a{color:#244bd8;text-underline-offset:.18em}a:hover{text-decoration-thickness:2px}a:focus-visible,button:focus-visible{outline:3px solid #f45132;outline-offset:3px}
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
    :root{--home-ink:#0b1830;--home-paper:#f3f6fb;--home-white:#fff;--home-blue:#2855f5;--home-coral:#f45132;--home-mint:#9fe1c0;--home-lilac:#cfc3ff;--home-muted:#56647b;--home-rule:#cdd7e8}
    body{overflow-x:hidden;background:var(--home-paper);color:var(--home-ink)}.home{padding-top:0}.home section{scroll-margin-top:24px}.home-header{padding-block:18px;border-bottom:1px solid rgba(11,24,48,.12)}.home-header nav{gap:3px}.home-header .nav-cta{margin-inline-start:8px;padding-inline:17px;color:#fff;background:var(--home-ink)}.home-header .nav-cta:hover{color:#fff;background:var(--home-blue)}
    .skip-link{position:fixed;z-index:100;top:10px;left:10px;padding:10px 14px;color:#fff;background:var(--home-ink);font-weight:800;text-decoration:none;transform:translateY(-160%)}.skip-link:focus{transform:none}.home-hero{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(370px,.92fr);gap:clamp(40px,6vw,88px);align-items:center;min-height:calc(100svh - 82px);padding:56px 0 72px}.home-hero-copy{position:relative;z-index:2;animation:hero-enter 620ms cubic-bezier(.16,1,.3,1) both}.home .eyebrow{margin:0;color:var(--home-blue);font-size:.72rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase}.hero-kicker{display:flex;gap:10px;align-items:center;margin-bottom:22px}.hero-kicker:before{width:26px;height:2px;background:var(--home-coral);content:""}.home h1{max-width:760px;margin:0;color:var(--home-ink);font-family:"Arial Narrow","Avenir Next Condensed","Roboto Condensed",ui-sans-serif,system-ui,sans-serif;font-size:clamp(4rem,8.4vw,7.7rem);font-stretch:condensed;font-weight:900;line-height:.82;letter-spacing:-.075em;text-wrap:balance}.home h1 em{display:block;margin-top:.08em;color:var(--home-coral);font-family:Iowan Old Style,Baskerville,Georgia,serif;font-size:.78em;font-weight:500;letter-spacing:-.06em;line-height:.92}.home-hero-copy>.lede{max-width:610px;margin:30px 0 0;color:var(--home-muted);font-size:clamp(1.05rem,1.4vw,1.22rem);line-height:1.68}.home-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:32px}.home-actions .button{margin:0;padding-inline:23px;background:var(--home-blue);box-shadow:0 10px 30px rgba(40,85,245,.24)}.button-secondary{display:inline-flex;min-height:48px;align-items:center;justify-content:center;padding:11px 18px;border-bottom:1px solid var(--home-ink);color:var(--home-ink);font-weight:800;text-decoration:none;transition:color 180ms ease,border-color 180ms ease}.button-secondary:hover{color:var(--home-blue);border-color:var(--home-blue)}.home-trust{display:flex;gap:10px 22px;flex-wrap:wrap;margin:24px 0 0;padding:0;list-style:none;color:#46546b;font-size:.84rem;font-weight:700}.home-trust li{display:flex;align-items:center;gap:7px}.home-trust li:before{width:7px;height:7px;border:2px solid var(--home-blue);border-radius:50%;content:""}
    .conversation-stage{position:relative;min-height:590px;isolation:isolate;animation:visual-enter 700ms 80ms cubic-bezier(.16,1,.3,1) both}.conversation-stage:before{position:absolute;inset:2% 7% 4% -3%;background:var(--home-lilac);clip-path:polygon(12% 0,100% 4%,91% 100%,0 88%);content:""}.conversation-window{position:absolute;inset:42px 0 68px 28px;overflow:hidden;border:2px solid var(--home-ink);background:#d9e2f3;clip-path:polygon(8% 0,100% 2%,94% 100%,0 92%)}.conversation-window img{width:100%;height:100%;display:block;object-fit:cover}.conversation-window:after{position:absolute;inset:0;background:linear-gradient(180deg,transparent 60%,rgba(11,24,48,.2));content:""}.visual-index{position:absolute;z-index:2;top:4px;right:2px;color:var(--home-ink);font-family:ui-monospace,monospace;font-size:.72rem;font-weight:800;letter-spacing:.1em;writing-mode:vertical-rl}.conversation-ribbon{position:absolute;z-index:3;right:-13%;bottom:76px;left:-11%;overflow:hidden;border-block:2px solid var(--home-ink);background:var(--home-coral);color:#fff;transform:rotate(-7deg)}.ribbon-track{display:flex;width:max-content;animation:ribbon-flow 18s linear infinite}.ribbon-track span{padding:10px 18px;font-size:.78rem;font-weight:850;letter-spacing:.08em;white-space:nowrap}.ribbon-track span:after{margin-inline-start:34px;content:"✦"}.hero-prompt{position:absolute;z-index:4;right:0;bottom:0;width:min(88%,390px);padding:20px 22px;border:2px solid var(--home-ink);background:var(--home-white);box-shadow:12px 12px 0 var(--home-mint)}.hero-prompt span{display:block;color:var(--home-blue);font-size:.68rem;font-weight:850;letter-spacing:.11em;text-transform:uppercase}.hero-prompt strong{display:block;margin-top:5px;font-family:Iowan Old Style,Baskerville,Georgia,serif;font-size:1.25rem;line-height:1.26}.home-proof{display:flex;gap:16px 34px;align-items:center;justify-content:space-between;padding:24px 0;border-block:1px solid var(--home-rule)}.proof-item{display:flex;gap:8px;align-items:baseline}.proof-item strong{color:var(--home-ink);font-family:"Arial Narrow","Avenir Next Condensed",sans-serif;font-size:1.65rem;line-height:1}.proof-item span{color:var(--home-muted);font-size:.82rem;font-weight:700}
    .home-section{padding:112px 0}.section-heading{display:grid;grid-template-columns:minmax(0,.95fr) minmax(290px,.5fr);gap:clamp(32px,7vw,92px);align-items:end;margin-bottom:52px}.section-heading h2{max-width:730px;margin:8px 0 0;color:var(--home-ink);font-family:"Arial Narrow","Avenir Next Condensed",ui-sans-serif,sans-serif;font-size:clamp(2.8rem,5.6vw,5.6rem);font-weight:900;line-height:.89;letter-spacing:-.065em;text-wrap:balance}.section-heading>p{max-width:520px;margin:0;color:var(--home-muted);font-size:1rem}.journey{display:grid;grid-template-columns:repeat(3,1fr);border-block:1px solid var(--home-ink)}.journey-step{position:relative;min-height:310px;padding:28px 30px 32px 0}.journey-step+.journey-step{padding-left:30px;border-left:1px solid var(--home-rule)}.journey-number{display:block;color:var(--home-coral);font-family:ui-monospace,monospace;font-size:.72rem;font-weight:850;letter-spacing:.1em}.journey-step h3{max-width:270px;margin:72px 0 12px;font-size:clamp(1.65rem,2.6vw,2.35rem);line-height:1;letter-spacing:-.045em}.journey-step p{max-width:330px;margin:0;color:var(--home-muted)}
    .role-section{padding-top:56px}.role-intro{display:flex;gap:30px;align-items:baseline;justify-content:space-between;margin-bottom:22px}.role-intro h2{margin:0;font-family:Iowan Old Style,Baskerville,Georgia,serif;font-size:clamp(2rem,4vw,3.8rem);font-style:italic;font-weight:500;letter-spacing:-.045em}.role-intro p{max-width:460px;margin:0;color:var(--home-muted)}.role-list{margin:0;padding:0;border-top:2px solid var(--home-ink);list-style:none}.role-list a{display:grid;grid-template-columns:minmax(180px,.55fr) minmax(280px,1fr) auto;gap:28px;align-items:center;min-height:142px;padding:24px 4px;border-bottom:1px solid var(--home-rule);color:var(--home-ink);text-decoration:none;transition:color 180ms ease,transform 180ms cubic-bezier(.16,1,.3,1)}.role-list strong{font-family:"Arial Narrow","Avenir Next Condensed",sans-serif;font-size:clamp(2.2rem,4vw,4.2rem);line-height:.9;letter-spacing:-.06em}.role-list span{max-width:530px;color:var(--home-muted)}.role-list b{font-size:1.55rem;font-weight:500}.role-list a:hover{color:var(--home-blue);transform:translateX(6px)}.role-list a:hover span{color:var(--home-ink)}
    .studio-section{position:relative;width:100vw;margin-left:calc(50% - 50vw);padding:110px max(16px,calc((100vw - 1120px)/2));overflow:hidden;background:var(--home-ink);color:#fff}.studio-grid{display:grid;grid-template-columns:minmax(0,.72fr) minmax(380px,1fr);gap:clamp(44px,7vw,100px);align-items:center}.studio-copy .eyebrow{color:var(--home-mint)}.studio-copy h2{max-width:580px;margin:10px 0 24px;font-family:"Arial Narrow","Avenir Next Condensed",sans-serif;font-size:clamp(3rem,6vw,6rem);font-weight:900;line-height:.86;letter-spacing:-.065em}.studio-copy p{max-width:540px;color:#bdc9dc}.studio-copy .studio-note{padding-top:22px;border-top:1px solid #34435c;color:#8fa0b9;font-size:.88rem}.studio-quote{position:relative;min-height:440px}.quote-mark{position:absolute;top:-90px;left:-28px;color:var(--home-coral);font-family:Georgia,serif;font-size:13rem;line-height:1}.quote-sheet{position:absolute;inset:48px 0 0 26px;padding:clamp(30px,5vw,62px);border:2px solid #fff;background:var(--home-paper);color:var(--home-ink);transform:rotate(1.5deg)}.quote-meta{display:flex;justify-content:space-between;color:#647189;font-family:ui-monospace,monospace;font-size:.7rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.quote-question{margin:80px 0 48px;font-family:Iowan Old Style,Baskerville,Georgia,serif;font-size:clamp(1.8rem,3.6vw,3.2rem);line-height:1.1;letter-spacing:-.04em}.quote-support{padding-top:18px;border-top:1px solid var(--home-rule);color:var(--home-muted);font-size:.9rem}
    .curriculum-section{padding-bottom:84px}.language-directory{display:flex;gap:12px 24px;flex-wrap:wrap;margin:0 0 34px}.language-directory a{min-height:44px;padding-block:9px;color:var(--home-ink);font-weight:800;text-decoration-thickness:2px}.topic-directory{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin:0;padding:0;border-top:2px solid var(--home-ink);list-style:none}.topic-directory li:nth-child(odd){padding-right:24px}.topic-directory li:nth-child(even){padding-left:24px;border-left:1px solid var(--home-rule)}.topic-directory a{display:grid;grid-template-columns:2.2rem 1fr auto;gap:10px;align-items:center;min-height:76px;border-bottom:1px solid var(--home-rule);color:var(--home-ink);text-decoration:none}.topic-directory i{color:var(--home-coral);font-family:ui-monospace,monospace;font-size:.68rem;font-style:normal}.topic-directory strong{font-size:1rem}.topic-directory span{color:var(--home-muted);font-family:ui-monospace,monospace;font-size:.7rem}.topic-directory a:hover strong{color:var(--home-blue)}.library-cta{display:flex;gap:18px;align-items:center;justify-content:space-between;margin-top:28px}.library-cta p{max-width:650px;margin:0;color:var(--home-muted)}.library-cta a{font-weight:850;white-space:nowrap}.open-section{display:grid;grid-template-columns:minmax(0,.9fr) minmax(280px,.45fr);gap:58px;align-items:end;margin-bottom:80px;padding:56px 0;border-block:1px solid var(--home-ink)}.open-section h2{max-width:720px;margin:8px 0 16px;font-family:"Arial Narrow","Avenir Next Condensed",sans-serif;font-size:clamp(2.6rem,5vw,5rem);line-height:.9;letter-spacing:-.06em}.open-section p{color:var(--home-muted)}.open-links{display:grid;border-top:1px solid var(--home-rule)}.open-links a{display:flex;min-height:52px;align-items:center;justify-content:space-between;border-bottom:1px solid var(--home-rule);color:var(--home-ink);font-weight:780;text-decoration:none}.open-links a:after{content:"↗"}.open-links a:hover{color:var(--home-blue)}
    @keyframes hero-enter{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}@keyframes visual-enter{from{opacity:0;transform:translateY(28px) scale(.98)}to{opacity:1;transform:none}}@keyframes ribbon-flow{to{transform:translateX(-50%)}}@supports(animation-timeline:view()){.journey-step,.role-list li,.studio-copy,.quote-sheet,.topic-directory li{opacity:.25;transform:translateY(22px);animation:section-reveal 1ms ease-out both;animation-timeline:view();animation-range:entry 8% cover 30%}@keyframes section-reveal{to{opacity:1;transform:none}}}
    @media(max-width:900px){.home-header nav a:not(.nav-cta):nth-child(2){display:none}.home-hero{grid-template-columns:1fr;min-height:0;padding-top:72px}.conversation-stage{min-height:570px;max-width:680px;width:100%;margin:8px auto 0}.home-proof{display:grid;grid-template-columns:repeat(2,1fr)}.section-heading,.studio-grid,.open-section{grid-template-columns:1fr}.journey{grid-template-columns:1fr}.journey-step{min-height:0;padding:28px 0 34px}.journey-step+.journey-step{padding-left:0;border-top:1px solid var(--home-rule);border-left:0}.journey-step h3{margin-top:34px}.role-list a{grid-template-columns:minmax(150px,.45fr) 1fr auto}.studio-section{padding-block:88px}.studio-quote{min-height:420px}.topic-directory{grid-template-columns:1fr}.topic-directory li:nth-child(n){padding:0;border-left:0}.library-cta{align-items:flex-start;flex-direction:column}}
    @media(max-width:640px){.home-header{align-items:center;flex-direction:row}.home-header nav{width:auto;overflow:visible;padding:0}.home-header nav a:not(.nav-cta){display:none}.home-header .nav-cta{margin:0}.home-hero{padding:52px 0 58px}.home h1{font-size:clamp(3.55rem,17vw,5rem)}.home-hero-copy>.lede{margin-top:24px}.home-actions{align-items:stretch}.home-actions a{width:100%}.button-secondary{border:1px solid var(--home-rule)}.conversation-stage{min-height:430px;margin-top:18px;overflow:clip}.conversation-window{inset:32px 0 56px 8px}.hero-prompt{width:88%;padding:15px 17px;box-shadow:8px 8px 0 var(--home-mint)}.hero-prompt strong{font-size:1.02rem}.conversation-ribbon{bottom:65px}.ribbon-track span{padding-block:8px}.home-proof{gap:0;padding:8px 0}.proof-item{display:block;padding:15px 8px}.proof-item strong,.proof-item span{display:block}.home-section{padding:78px 0}.section-heading{margin-bottom:34px}.section-heading h2{font-size:clamp(2.7rem,13vw,4.2rem)}.role-intro{align-items:flex-start;flex-direction:column}.role-list a{grid-template-columns:1fr auto;gap:10px;min-height:0;padding:28px 0}.role-list strong{font-size:2.7rem}.role-list span{grid-column:1/-1;grid-row:2}.studio-section{padding-block:74px}.studio-copy h2{font-size:clamp(3.1rem,14vw,4.7rem)}.studio-quote{min-height:390px}.quote-sheet{inset:48px 4px 0 8px;padding:28px 24px}.quote-question{margin:64px 0 36px;font-size:1.8rem}.quote-mark{top:-60px;font-size:10rem}.topic-directory a{grid-template-columns:1.7rem 1fr auto}.open-section{margin-bottom:52px;padding-block:46px}.site-footer{width:calc(100% - 32px)}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.home-hero-copy,.conversation-stage,.ribbon-track,.journey-step,.role-list li,.studio-copy,.quote-sheet,.topic-directory li{opacity:1;animation:none;transform:none}.role-list a,.button-secondary{transition:none}.role-list a:hover{transform:none}}
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
  stylesheet?: string;
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
    ${options.stylesheet ? `<link rel="stylesheet" href="${options.stylesheet}" />` : ""}
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

function homepageHeader() {
  return `<header class="site-header home-header page">
    <a class="brand" href="/" aria-label="LinguaFlow home">Lingua<span>Flow</span></a>
    <nav aria-label="Primary">
      <a href="#how-it-works">How it works</a>
      <a href="/teachers/">For teachers</a>
      <a class="nav-cta" href="/app/?role=learner">Start speaking</a>
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
  const featuredTopics = Array.from(
    new Map(topicCatalog.all().map((topic) => [topic.category, topic])).values(),
  );
  const topicLinks = featuredTopics
    .map(
      (topic, index) =>
        `<li><a href="${topicPath("EN", topic)}"><i>${String(index + 1).padStart(2, "0")}</i><strong>${escapeHtml(topic.title.EN)}</strong><span>${topic.level}</span></a></li>`,
    )
    .join("");
  const ribbonCopy = [
    "English · What changed your mind?",
    "Polski · Co ostatnio Cię zaskoczyło?",
    "日本語 · 最近、心に残ったことは？",
  ];
  const ribbon = [...ribbonCopy, ...ribbonCopy]
    .map((text) => `<span>${text}</span>`)
    .join("");
  return `<main class="page home seo-fallback">
    <section class="home-hero" aria-labelledby="home-heading">
      <div class="home-hero-copy">
        <div class="hero-kicker"><p class="eyebrow">Open-source speaking practice</p></div>
        <h1 id="home-heading">Talk about <em>something real.</em></h1>
        <p class="lede">Choose a language direction, open a thoughtful prompt, and start speaking. LinguaFlow gives learners and teachers enough structure to keep a conversation moving—without accounts, ads, grading, or a wall of exercises.</p>
        <div class="home-actions">
          <a class="button" href="/app/?role=learner">Start speaking&nbsp; →</a>
          <a class="button-secondary" href="#how-it-works">See how it works</a>
        </div>
        <ul class="home-trust" aria-label="Product highlights">
          <li>No account</li><li>48 reviewed topics</li><li>English · Polski · 日本語</li>
        </ul>
      </div>
      <div class="conversation-stage" role="img" aria-label="Adult learners having a multilingual guided conversation">
        <span class="visual-index" aria-hidden="true">LINGUAFLOW / 001</span>
        <div class="conversation-window">
          <picture>
            <source media="(max-width: 720px)" srcset="/images/linguaflow-guided-session-720.webp" />
            <img src="/images/linguaflow-guided-session-1200.webp" width="1200" height="675" alt="A teacher guiding three adult learners through a friendly online conversation" loading="eager" fetchpriority="high" decoding="async" />
          </picture>
        </div>
        <div class="conversation-ribbon" aria-hidden="true"><div class="ribbon-track">${ribbon}</div></div>
        <div class="hero-prompt"><span>Tonight’s first question · B1</span><strong>What makes a place feel like home?</strong></div>
      </div>
    </section>
    <section class="home-proof" aria-label="LinguaFlow curriculum at a glance">
      <div class="proof-item"><strong>48</strong><span>real-life topics</span></div>
      <div class="proof-item"><strong>288</strong><span>guided questions</span></div>
      <div class="proof-item"><strong>3</strong><span>complete languages</span></div>
      <div class="proof-item"><strong>A1–C1</strong><span>CEFR levels</span></div>
    </section>
    <section class="home-section" id="how-it-works" aria-labelledby="how-heading">
      <div class="section-heading">
        <div><p class="eyebrow">From intention to conversation</p><h2 id="how-heading">Less setup. More human exchange.</h2></div>
        <p>LinguaFlow keeps the decisions small and the purpose obvious. You always know which language you are practising, what kind of conversation you are opening, and what to do next.</p>
      </div>
      <div class="journey">
        <article class="journey-step"><span class="journey-number">01 / DIRECTION</span><h3>Choose where your voice is going.</h3><p>Set the language you want to speak and a different support language. The distinction stays visible, so translation helps without quietly replacing practice.</p></article>
        <article class="journey-step"><span class="journey-number">02 / SUBJECT</span><h3>Pick something worth discussing.</h3><p>Browse daily life, travel, work, culture, science, relationships, and more. Every topic is level-aware and written to invite real opinions rather than textbook answers.</p></article>
        <article class="journey-step"><span class="journey-number">03 / SPEAK</span><h3>Follow the energy in the room.</h3><p>Move through one prompt at a time on your own, or let a teacher guide a shared room. Support and vocabulary are nearby, never piled in front of the conversation.</p></article>
      </div>
    </section>
    <section class="role-section" aria-labelledby="role-heading">
      <div class="role-intro"><h2 id="role-heading">Enter in your own way.</h2><p>Your choice carries into a short three-step welcome, so the workspace begins with the right tools and no confusing detour.</p></div>
      <ul class="role-list">
        <li><a href="/app/?role=learner"><strong>Learner</strong><span>Practise independently with one question at a time, optional support, useful vocabulary, and private notes that stay on your device.</span><b aria-hidden="true">→</b></a></li>
        <li><a href="/app/?role=teacher"><strong>Teacher</strong><span>Choose a topic, prepare a room, and guide everyone through the same authored conversation without building another slide deck.</span><b aria-hidden="true">→</b></a></li>
        <li><a href="/app/?role=student"><strong>Student</strong><span>Join with a short room code. Stay aligned with the teacher’s current question without an account, recording, or transcript.</span><b aria-hidden="true">→</b></a></li>
      </ul>
    </section>
    <section class="studio-section" aria-labelledby="studio-heading">
      <div class="studio-grid">
        <div class="studio-copy">
          <p class="eyebrow">A quiet studio for speaking</p>
          <h2 id="studio-heading">One good question can unlock a room.</h2>
          <p>Guided mode holds attention on the current exchange instead of turning practice into a dashboard. Teachers can pace warm-up, practice, pause, reflection, and completion; independent learners can simply move forward when they are ready.</p>
          <p class="studio-note">The default project does not grade speech, record audio, collect transcripts, require an account, or add advertising trackers. Live rooms are temporary and expire after eight hours.</p>
        </div>
        <div class="studio-quote" aria-label="Example LinguaFlow conversation prompt">
          <span class="quote-mark" aria-hidden="true">“</span>
          <article class="quote-sheet">
            <div class="quote-meta"><span>Remote work</span><span>B2 · 02 / 06</span></div>
            <p class="quote-question">What helps people feel connected when they work far apart?</p>
            <p class="quote-support">Support can appear in English, Polish, or Japanese without replacing the language you are practising.</p>
          </article>
        </div>
      </div>
    </section>
    <section class="home-section curriculum-section" id="topic-library" aria-labelledby="library-heading">
      <div class="section-heading">
        <div><p class="eyebrow">The open conversation library</p><h2 id="library-heading">Forty-eight ways past “How are you?”</h2></div>
        <p>Every public topic includes a central prompt, at least five follow-up questions, vocabulary support, facilitation guidance, and a direct practice link. These featured starting points span all twelve curriculum categories.</p>
      </div>
      <nav class="language-directory" aria-label="Browse curriculum by language"><a href="/en/">Browse in English</a><a href="/pl/">Przeglądaj po polsku</a><a href="/ja/" lang="ja">日本語で見る</a></nav>
      <ul class="topic-directory">${topicLinks}</ul>
      <div class="library-cta"><p>Prefer a different subject? Explore the complete collection across daily life, work, travel, relationships, technology, health, education, environment, food, arts, science, and society.</p><a href="/en/">See all 48 topics →</a></div>
    </section>
    <section class="open-section" aria-labelledby="open-heading">
      <div><p class="eyebrow">Open by design</p><h2 id="open-heading">A language tool you can inspect, carry, and improve.</h2><p>LinguaFlow publishes its multilingual curriculum as human-reviewable source data. Versioned topic packs carry license, authorship, compatibility, facilitation notes, and review assertions. Contributors can validate a pack in the browser before sharing it, while learners keep private notes and saved material on their own device. Schools and communities can self-host the same transparent foundation.</p></div>
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
    stylesheet: "/landing.css",
    body: `<a class="skip-link" href="#home-heading">Skip to content</a>${homepageHeader()}${homepageContent()}${footer()}`,
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
      await writeOutput("landing.css", homepageStyles());
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
