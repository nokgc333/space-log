import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { contact } from "@/lib/content";

const requestHeaders = vi.hoisted(() => ({
  current: {} as Record<string, string>,
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(requestHeaders.current),
}));

const VALID = {
  name: "  山田 太郎  ",
  email: "taro@example.com",
  company: "",
  topic: contact.topics[0].value,
  message: "相談です",
  consent: true,
  website: "",
};
const MAIL_ENV = {
  RESEND_API_KEY: "secret-key",
  CONTACT_MAIL_FROM: "Site <site@example.com>",
  CONTACT_MAIL_TO: "owner@example.com",
};

let ipCounter = 0;
const fetchMock = vi.fn();
let errorLog: ReturnType<typeof vi.spyOn>;
let warnLog: ReturnType<typeof vi.spyOn>;

async function loadAction() {
  vi.resetModules();
  return (await import("./submit-contact")).submitContact;
}

function withMailSettings(env: Record<string, string> = MAIL_ENV) {
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
}

beforeEach(() => {
  ipCounter += 1;
  requestHeaders.current = { "x-forwarded-for": `203.0.113.${ipCounter}` };
  fetchMock.mockReset().mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  for (const name of Object.keys(MAIL_ENV)) vi.stubEnv(name, "");
  errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
  warnLog = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("submitContact", () => {
  describe("checking the entry again on the server", () => {
    it("names the fields that are wrong, one message each", async () => {
      const submitContact = await loadAction();
      const result = await submitContact({
        ...VALID,
        email: "taro@",
        consent: false,
      });
      expect(result).toEqual({
        ok: false,
        kind: "invalid",
        errors: {
          email: contact.messages.email,
          consent: contact.messages.consent,
        },
      });
    });

    it("gives only the first message when one field breaks several rules", async () => {
      const submitContact = await loadAction();
      const result = await submitContact({ ...VALID, email: "" });
      expect(result).toMatchObject({
        kind: "invalid",
        errors: { email: contact.messages.required },
      });
    });

    it("sends nothing for a wrong entry", async () => {
      withMailSettings();
      const submitContact = await loadAction();
      await submitContact({ ...VALID, email: "taro@" });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("the hidden trap field", () => {
    it("answers as usual but sends nothing when it is filled", async () => {
      withMailSettings();
      const submitContact = await loadAction();
      const result = await submitContact({
        ...VALID,
        website: "http://spam.example",
      });
      expect(result).toEqual({ ok: true, mode: "demo" });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("without mail settings (demo mode)", () => {
    it("accepts the entry, says it is a demo and sends nothing", async () => {
      const submitContact = await loadAction();
      expect(await submitContact(VALID)).toEqual({ ok: true, mode: "demo" });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("warns in the server log without repeating the entry", async () => {
      const submitContact = await loadAction();
      await submitContact(VALID);
      expect(warnLog).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(warnLog.mock.calls)).not.toContain(
        "taro@example.com",
      );
    });
  });
});
