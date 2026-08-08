import type { FacilitationGuide, Locale, Topic, TopicProvenance } from "../domain/types";

const localized = (EN: string, PL: string, JA: string): Record<Locale, string> => ({ EN, PL, JA });

const coreProvenance: TopicProvenance = {
  packId: "linguaflow-core",
  packVersion: "0.5.0",
  license: "MIT",
  authors: [{ displayName: "LinguaFlow contributors", url: "https://github.com/RobTar97/linguaflow" }],
  sourceUrl: "https://github.com/RobTar97/linguaflow",
  reviews: [],
};

export function baselineFacilitation(topic: Topic): FacilitationGuide {
  const advanced = topic.level === "B2" || topic.level === "C1";
  return {
    durationMinutes: { min: 15, max: advanced ? 30 : 25 },
    groupSize: { min: 2, max: 12 },
    objectives: {
      EN: ["Exchange personal perspectives", "Use the topic vocabulary in context"],
      PL: ["Wymieniaj osobiste perspektywy", "Używaj słownictwa z tematu w kontekście"],
      JA: ["自分の考えを伝え合う", "トピックの語彙を文脈で使う"],
    },
    preparation: localized(
      "Choose a target language and review the prompts before the session.",
      "Wybierz język docelowy i przejrzyj pytania przed zajęciami.",
      "目標言語を選び、セッション前に質問を確認します。",
    ),
    warmUp: localized(
      "Invite each learner to answer the main prompt in one sentence.",
      "Poproś każdą osobę o odpowiedź na główne pytanie jednym zdaniem.",
      "各学習者にメインの質問へ一文で答えてもらいます。",
    ),
    tips: {
      EN: ["Model one answer before pair work", "Let learners ask one follow-up of their own"],
      PL: ["Pokaż przykładową odpowiedź przed pracą w parach", "Pozwól uczniom zadać własne pytanie dodatkowe"],
      JA: ["ペア活動の前に回答例を示す", "学習者自身の追加質問を一つ促す"],
    },
    easier: localized(
      "Use the vocabulary list as sentence starters and answer three prompts.",
      "Użyj słownictwa jako początków zdań i odpowiedz na trzy pytania.",
      "語彙リストを文の書き出しに使い、三つの質問に答えます。",
    ),
    harder: localized(
      "Ask learners to compare viewpoints, justify an opinion, and summarize their partner.",
      "Poproś o porównanie perspektyw, uzasadnienie opinii i podsumowanie wypowiedzi partnera.",
      "意見を比較し、理由を述べ、相手の考えを要約してもらいます。",
    ),
  };
}

export function enrichCoreTopic(topic: Topic): Topic {
  return {
    ...topic,
    artwork: { kind: "atlas", index: topic.artIndex, atlas: topic.atlas },
    facilitation: baselineFacilitation(topic),
    provenance: coreProvenance,
  };
}
