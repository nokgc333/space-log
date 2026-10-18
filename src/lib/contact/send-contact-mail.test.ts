import { describe, expect, it, vi } from "vitest";

import { sendContactMail } from "./send-contact-mail";

const CONFIG = { apiKey: "k", from: "a@example.com", to: "b@example.com" };
const MAIL = {
  from: "a@example.com",
  to: ["b@example.com"],
  reply_to: "c@example.com",
  subject: "s",
  text: "t",
};

describe("sendContactMail", () => {
  it("posts the mail as JSON to the mail service", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    await sendContactMail(CONFIG, MAIL, fetchFn);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual(MAIL);
  });

  it("sends the key in the header, never in the body or the address", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    await sendContactMail(CONFIG, MAIL, fetchFn);
    const [url, init] = fetchFn.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer k");
    expect(init.body).not.toContain("Bearer");
    expect(url).not.toContain("k=");
  });

  it("gives up after a time limit", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    await sendContactMail(CONFIG, MAIL, fetchFn);
    expect(fetchFn.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("reports only the status when the service refuses", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(new Response("typed text", { status: 422 }));
    const failure = sendContactMail(CONFIG, MAIL, fetchFn);
    await expect(failure).rejects.toThrow("status 422");
    await expect(failure).rejects.not.toThrow("typed text");
  });

  it("lets a network error through", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(sendContactMail(CONFIG, MAIL, fetchFn)).rejects.toThrow(
      "offline",
    );
  });
});
