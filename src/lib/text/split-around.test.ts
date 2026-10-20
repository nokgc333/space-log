import { describe, expect, it } from "vitest";

import { splitAround } from "./split-around";

describe("splitAround", () => {
  it("returns the text before and after the first match", () => {
    expect(
      splitAround("I agree to the privacy policy now", "privacy policy"),
    ).toEqual(["I agree to the ", " now"]);
  });

  it("returns an empty text before when the text starts with the match", () => {
    expect(
      splitAround("プライバシーポリシーに同意します", "プライバシーポリシー"),
    ).toEqual(["", "に同意します"]);
  });

  it("returns an empty text after when the text ends with the match", () => {
    expect(splitAround("see the policy", "policy")).toEqual(["see the ", ""]);
  });

  it("splits only at the first match when the match appears twice", () => {
    expect(splitAround("a-b-a", "a")).toEqual(["", "-b-a"]);
  });

  it("returns null when the text does not contain the match", () => {
    expect(splitAround("nothing here", "policy")).toBeNull();
  });

  it("returns null for an empty match, which would split everywhere", () => {
    expect(splitAround("text", "")).toBeNull();
  });

  it("is case sensitive", () => {
    expect(splitAround("Policy", "policy")).toBeNull();
  });
});
