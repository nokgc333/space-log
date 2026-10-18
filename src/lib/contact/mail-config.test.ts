import { describe, expect, it } from "vitest";

import { resolveMailConfig } from "./mail-config";

const COMPLETE = {
  RESEND_API_KEY: "secret-key",
  CONTACT_MAIL_FROM: "Site <site@example.com>",
  CONTACT_MAIL_TO: "owner@example.com",
};

describe("resolveMailConfig", () => {
  it("returns null when nothing is set (demo mode)", () => {
    expect(resolveMailConfig({})).toBeNull();
  });

  it("treats empty values like missing ones", () => {
    expect(
      resolveMailConfig({
        RESEND_API_KEY: "",
        CONTACT_MAIL_FROM: "",
        CONTACT_MAIL_TO: "",
      }),
    ).toBeNull();
  });

  it("accepts a complete setting", () => {
    expect(resolveMailConfig(COMPLETE)).toEqual({
      apiKey: "secret-key",
      from: "Site <site@example.com>",
      to: "owner@example.com",
    });
  });

  it("accepts a plain address as the sender", () => {
    const config = resolveMailConfig({
      ...COMPLETE,
      CONTACT_MAIL_FROM: "site@example.com",
    });
    expect(config?.from).toBe("site@example.com");
  });

  describe("a partial setting stops with the names of what is missing", () => {
    it.each([
      [
        ["CONTACT_MAIL_FROM", "CONTACT_MAIL_TO"],
        { RESEND_API_KEY: "secret-key" },
      ],
      [
        ["RESEND_API_KEY"],
        {
          CONTACT_MAIL_FROM: "a@example.com",
          CONTACT_MAIL_TO: "b@example.com",
        },
      ],
      [
        ["CONTACT_MAIL_TO"],
        { RESEND_API_KEY: "k", CONTACT_MAIL_FROM: "a@example.com" },
      ],
    ])("missing %j", (missing, env) => {
      let message = "";
      try {
        resolveMailConfig(env);
      } catch (error) {
        message = (error as Error).message;
      }
      for (const name of missing) expect(message).toContain(name);
    });

    it("never repeats a value", () => {
      let message = "";
      try {
        resolveMailConfig({ RESEND_API_KEY: "secret-key" });
      } catch (error) {
        message = (error as Error).message;
      }
      expect(message).not.toContain("secret-key");
    });
  });

  describe("addresses", () => {
    it.each([
      "not-an-address",
      "a@b",
      "a,b@example.com",
      "a@example.com, b@example.com",
      "Name <a@example.com> extra",
      "a@example.com\nBcc: x@example.com",
    ])("rejects %j as the sender", (from) => {
      expect(() =>
        resolveMailConfig({ ...COMPLETE, CONTACT_MAIL_FROM: from }),
      ).toThrow(/CONTACT_MAIL_FROM/);
    });

    it.each([
      "not-an-address",
      "a,b@example.com",
      "a@example.com,b@example.com",
      "Owner <a@example.com>",
      "a@example.com\nBcc: x@example.com",
    ])("rejects %j as the recipient (one plain address only)", (to) => {
      expect(() =>
        resolveMailConfig({ ...COMPLETE, CONTACT_MAIL_TO: to }),
      ).toThrow(/CONTACT_MAIL_TO/);
    });

    it("does not repeat the wrong address in the error", () => {
      expect(() =>
        resolveMailConfig({ ...COMPLETE, CONTACT_MAIL_TO: "wrong-address" }),
      ).not.toThrow(/wrong-address/);
    });
  });
});
