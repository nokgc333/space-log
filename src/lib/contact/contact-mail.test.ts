import { describe, expect, it } from "vitest";

import type { ContactMail as MailCopy } from "@/lib/content";

import { buildContactMail } from "./contact-mail";

const COPY: MailCopy = {
  subject: "Fixed subject",
  labels: {
    name: "NAME",
    email: "EMAIL",
    company: "COMPANY",
    topic: "TOPIC",
    message: "MESSAGE",
  },
  empty: "(none)",
};
const ROUTE = { from: "site@example.com", to: "owner@example.com" };
const VALUES = {
  name: "山田 太郎",
  email: "taro@example.com",
  company: "",
  topic: "tools",
  message: "相談です",
  consent: true,
  website: "",
};

describe("buildContactMail", () => {
  it("sends from the site's address to the owner only", () => {
    const mail = buildContactMail(VALUES, ROUTE, "Tools", COPY);
    expect(mail.from).toBe(ROUTE.from);
    expect(mail.to).toEqual([ROUTE.to]);
  });

  it("replies to the sender", () => {
    expect(buildContactMail(VALUES, ROUTE, "Tools", COPY).reply_to).toBe(
      VALUES.email,
    );
  });

  it("uses the fixed subject, whatever was typed", () => {
    const typed = { ...VALUES, name: "Subject: spam", message: "Subject: x" };
    const mail = buildContactMail(typed, ROUTE, "Tools", COPY);
    expect(mail.subject).toBe(COPY.subject);
    expect(mail.subject).not.toContain("spam");
  });

  it("lists every answer under its label, the topic by its label text", () => {
    const mail = buildContactMail(
      { ...VALUES, company: "Studio" },
      ROUTE,
      "ツール開発",
      COPY,
    );
    expect(mail.text.split("\n")).toEqual([
      "NAME: 山田 太郎",
      "EMAIL: taro@example.com",
      "COMPANY: Studio",
      "TOPIC: ツール開発",
      "MESSAGE:",
      "相談です",
    ]);
  });

  it("writes the empty mark for an empty company", () => {
    const mail = buildContactMail(VALUES, ROUTE, "Tools", COPY);
    expect(mail.text).toContain("COMPANY: (none)");
  });

  it("keeps the line breaks of the message", () => {
    const mail = buildContactMail(
      { ...VALUES, message: "一行目\n二行目" },
      ROUTE,
      "Tools",
      COPY,
    );
    expect(mail.text.endsWith("MESSAGE:\n一行目\n二行目")).toBe(true);
  });

  it("is plain text only", () => {
    const mail = buildContactMail(
      { ...VALUES, message: "<b>bold</b>" },
      ROUTE,
      "Tools",
      COPY,
    );
    expect(mail).not.toHaveProperty("html");
    expect(mail.text).toContain("<b>bold</b>");
  });
});
