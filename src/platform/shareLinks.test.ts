import { describe, expect, it } from "vitest";
import {
  buildJoinUrl,
  buildPracticeUrl,
  readShareIntent,
} from "./shareLinks";

describe("share links", () => {
  it("round-trips a room invitation", () => {
    const url = new URL(buildJoinUrl("abc-123", "https://example.com/current"));
    expect(url.pathname).toBe("/");
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
    expect(readShareIntent(url.search)).toEqual({
      kind: "practice",
      topicId: "space-exploration",
      targetLanguage: "JA",
      supportLanguage: "EN",
      level: "B2",
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
});
