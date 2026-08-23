import { describe, expect, it } from "vitest";
import { topicCatalog } from "../catalog/topicCatalog";
import { createConversationSession } from "./conversationSession";

describe("Conversation session", () => {
  it("owns ordered, bounded progression through a Topic", () => {
    const topic = topicCatalog.all()[0];
    const session = createConversationSession(topic, "EN", "PL");
    expect(session.questions[0].target).toBe(topic.mainPrompt.EN);
    expect(session.view(-4).index).toBe(0);
    expect(session.previous(0)).toBe(0);
    expect(session.view(999).isLast).toBe(true);
    expect(session.next(session.questions.length - 1)).toBe(session.questions.length - 1);
  });

  it("keeps support text aligned and makes missing translations explicit", () => {
    const session = createConversationSession({
      mainPrompt: { EN: "Main", PL: "Główne" },
      followUps: { EN: ["One", "Two"], PL: ["Jeden"] },
      vocabulary: { EN: [] },
    }, "EN", "PL");
    expect(session.questions).toEqual([
      { target: "Main", support: "Główne" },
      { target: "One", support: "Jeden" },
      { target: "Two" },
    ]);
  });

  it("rejects an invalid language direction", () => {
    const topic = topicCatalog.all()[0];
    expect(() => createConversationSession(topic, "EN", "EN")).toThrow(/different/);
  });
});
