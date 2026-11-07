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

    it.each([null, undefined, "text", 42, []])(
      "does not crash on %j",
      async (input) => {
        const submitContact = await loadAction();
        const result = await submitContact(input);
        expect(result).toMatchObject({ ok: false, kind: "invalid" });
      },
    );
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

  describe("with complete mail settings", () => {
    it("sends the checked entry to the owner and says it was sent", async () => {
      withMailSettings();
      const submitContact = await loadAction();
      expect(await submitContact(VALID)).toEqual({ ok: true, mode: "sent" });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.resend.com/emails");
      expect(init.headers.Authorization).toBe("Bearer secret-key");
      const mail = JSON.parse(init.body);
      expect(mail.from).toBe("Site <site@example.com>");
      expect(mail.to).toEqual(["owner@example.com"]);
      expect(mail.reply_to).toBe("taro@example.com");
      expect(mail.subject).toBe(contact.mail.subject);
      expect(mail.text).toContain(`${contact.mail.labels.name}: 山田 太郎\n`);
      expect(mail.text).toContain(
        `${contact.mail.labels.topic}: ${contact.topics[0].label}`,
      );
    });

    it.each(["name", "email", "company"])(
      "sends nothing when %s holds a line break that could add a mail header",
      async (field) => {
        withMailSettings();
        const submitContact = await loadAction();
        const value =
          field === "email"
            ? "a@example.com\r\nBcc: attacker@example.test"
            : "a\r\nBcc: attacker@example.test";

        expect(await submitContact({ ...VALID, [field]: value })).toMatchObject(
          { ok: false, kind: "invalid" },
        );
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );

    it("does not log anything on success", async () => {
      withMailSettings();
      const submitContact = await loadAction();
      await submitContact(VALID);
      expect(errorLog).not.toHaveBeenCalled();
      expect(warnLog).not.toHaveBeenCalled();
    });

    it("reports a failure when the mail service refuses, logging only the status", async () => {
      withMailSettings();
      fetchMock.mockResolvedValue(
        new Response("echo: 相談です", { status: 500 }),
      );
      const submitContact = await loadAction();
      expect(await submitContact(VALID)).toEqual({ ok: false, kind: "failed" });
      const logged = JSON.stringify(errorLog.mock.calls);
      expect(logged).toContain("status 500");
      expect(logged).not.toContain("相談です");
      expect(logged).not.toContain("secret-key");
      expect(logged).not.toContain("taro@example.com");
    });

    it("reports a failure when the network is down", async () => {
      withMailSettings();
      fetchMock.mockRejectedValue(new Error("offline"));
      const submitContact = await loadAction();
      expect(await submitContact(VALID)).toEqual({ ok: false, kind: "failed" });
      expect(errorLog).toHaveBeenCalledTimes(1);
    });
  });

  describe("with only some of the mail settings", () => {
    it("reports a failure and names what is missing, never a value", async () => {
      withMailSettings({ RESEND_API_KEY: "secret-key" });
      const submitContact = await loadAction();
      expect(await submitContact(VALID)).toEqual({ ok: false, kind: "failed" });
      const logged = JSON.stringify(errorLog.mock.calls);
      expect(logged).toContain("CONTACT_MAIL_FROM");
      expect(logged).not.toContain("secret-key");
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("limiting how often one visitor can send", () => {
    it("lets 5 attempts in 10 minutes through and turns the 6th away", async () => {
      const submitContact = await loadAction();
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        expect(await submitContact(VALID)).toEqual({ ok: true, mode: "demo" });
      }
      const sixth = await submitContact(VALID);
      expect(sixth).toMatchObject({ ok: false, kind: "rate-limited" });
      expect(
        sixth.ok === false &&
          sixth.kind === "rate-limited" &&
          sixth.retryAfterSeconds,
      ).toBeGreaterThan(0);
    });

    it("counts wrong entries too", async () => {
      const submitContact = await loadAction();
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        await submitContact({ ...VALID, email: "x" });
      }
      expect(await submitContact(VALID)).toMatchObject({
        kind: "rate-limited",
      });
    });

    it("sends nothing for a visitor who is turned away", async () => {
      withMailSettings();
      const submitContact = await loadAction();
      for (let attempt = 1; attempt <= 6; attempt += 1)
        await submitContact(VALID);
      expect(fetchMock).toHaveBeenCalledTimes(5);
    });

    it("counts each visitor on their own", async () => {
      const submitContact = await loadAction();
      for (let attempt = 1; attempt <= 6; attempt += 1)
        await submitContact(VALID);
      requestHeaders.current = { "x-forwarded-for": "198.51.100.7" };
      expect(await submitContact(VALID)).toEqual({ ok: true, mode: "demo" });
    });

    it("tells visitors apart by the first address of the forwarded list", async () => {
      const submitContact = await loadAction();
      requestHeaders.current = { "x-forwarded-for": "198.51.100.1, 10.0.0.1" };
      for (let attempt = 1; attempt <= 5; attempt += 1)
        await submitContact(VALID);
      requestHeaders.current = { "x-forwarded-for": "198.51.100.1, 10.0.0.2" };
      expect(await submitContact(VALID)).toMatchObject({
        kind: "rate-limited",
      });
    });

    it("falls back to the real-ip header, then to one shared visitor", async () => {
      const submitContact = await loadAction();
      requestHeaders.current = { "x-real-ip": "198.51.100.9" };
      for (let attempt = 1; attempt <= 5; attempt += 1)
        await submitContact(VALID);
      expect(await submitContact(VALID)).toMatchObject({
        kind: "rate-limited",
      });

      requestHeaders.current = { "x-real-ip": "198.51.100.10" };
      expect(await submitContact(VALID)).toEqual({ ok: true, mode: "demo" });

      requestHeaders.current = {};
      for (let attempt = 1; attempt <= 5; attempt += 1)
        await submitContact(VALID);
      requestHeaders.current = {};
      expect(await submitContact(VALID)).toMatchObject({
        kind: "rate-limited",
      });
    });

    it("reports a failure without a message when the network error is not an Error", async () => {
      withMailSettings();
      fetchMock.mockRejectedValue("offline");
      const submitContact = await loadAction();
      expect(await submitContact(VALID)).toEqual({ ok: false, kind: "failed" });
      expect(JSON.stringify(errorLog.mock.calls)).toContain("Mail failed");
    });
  });

  describe("with settings that cannot be read as text", () => {
    it("reports a failure with a general message when something other than an Error is thrown", async () => {
      vi.resetModules();
      vi.doMock("@/lib/contact/mail-config", () => ({
        resolveMailConfig: () => {
          throw "broken";
        },
      }));
      const { submitContact } = await import("./submit-contact");
      expect(await submitContact(VALID)).toEqual({ ok: false, kind: "failed" });
      expect(JSON.stringify(errorLog.mock.calls)).toContain(
        "Mail settings failed",
      );
      vi.doUnmock("@/lib/contact/mail-config");
    });
  });
});
