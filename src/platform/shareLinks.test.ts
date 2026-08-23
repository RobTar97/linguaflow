import { describe, expect, it } from "vitest";
import {
  buildJoinUrl,
  buildPracticeUrl,
  readEntryRole,
  readShareIntent,
} from "./shareLinks";

describe("share links", () => {
  it("round-trips a room invitation", () => {
    const url = new URL(buildJoinUrl("abc-123", "https://example.com/current"));
    expect(url.pathname).toBe("/app/");
    expect(readShareIntent(url.search)).toEqual({
      kind: "join",
      code: "ABC-123",
    });
  });

  it("round-trips a self-paced practice assignment", () => {
    const url = new URL(
      buildPracticeUrl(
        {
          topicId: "space-exploration",
          targetLanguage: "JA",
          supportLanguage: "EN",
          level: "B2",
        },
        "https://example.com/teacher",
      ),
    );
    expect(url.pathname).toBe("/app/");
    expect(readShareIntent(url.search)).toEqual({
      kind: "practice",
      topicId: "space-exploration",
      targetLanguage: "JA",
      supportLanguage: "EN",
      level: "B2",
    });
  });

  it("round-trips an installed-pack Topic assignment", () => {
    const url = new URL(buildPracticeUrl({
      topicId: "community-pack:city-stories",
      targetLanguage: "EN",
      supportLanguage: "PL",
      level: "B1",
    }, "https://example.com/teacher"));
    expect(readShareIntent(url.search)).toMatchObject({
      kind: "practice",
      topicId: "community-pack:city-stories",
    });
  });

  it("rejects malformed or same-language links", () => {
    expect(readShareIntent("?room=bad")).toBeNull();
    expect(
      readShareIntent(
        "?practice=space-exploration&target=JA&support=JA&level=B2",
      ),
    ).toBeNull();
  });

  it("reads only supported landing-page role hints", () => {
    expect(readEntryRole("?role=learner")).toBe("learner");
    expect(readEntryRole("?role=teacher")).toBe("teacher");
    expect(readEntryRole("?role=student")).toBe("student");
    expect(readEntryRole("?role=admin")).toBeNull();
    expect(readEntryRole("?role=Teacher")).toBeNull();
    expect(readEntryRole("?room=ABC-123")).toBeNull();
  });
});
