import { describe, expect, it } from "vitest";

import type { ContactMessages } from "@/lib/content";

import { buildContactSchema } from "./contact-schema";

const MESSAGES: ContactMessages = {
  required: "required!",
  tooLong: "too long!",
  email: "bad email!",
  singleLine: "one line only!",
  choose: "choose one!",
  consent: "consent needed!",
};
const TOPICS = ["pipeline", "tools"];
const schema = buildContactSchema(MESSAGES, TOPICS);
const VALID = {
  name: "山田 太郎",
  email: "taro@example.com",
  company: "",
  topic: "pipeline",
  message: "相談です",
  consent: true,
  website: "",
};

function messageOf(input: unknown, field: string): string | undefined {
  const result = schema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("contact schema", () => {
  it("accepts a complete entry with an empty optional company", () => {
    expect(schema.safeParse(VALID).success).toBe(true);
  });

  it("trims the text it keeps", () => {
    const result = schema.safeParse({
      ...VALID,
      name: "  山田  ",
      message: " 内容 ",
    });
    expect(result.success && result.data.name).toBe("山田");
    expect(result.success && result.data.message).toBe("内容");
  });

  it("fills in the trap field when it is missing", () => {
    const withoutTrap = Object.fromEntries(
      Object.entries(VALID).filter(([key]) => key !== "website"),
    );
    const result = schema.safeParse(withoutTrap);
    expect(result.success && result.data.website).toBe("");
  });

  describe("required fields", () => {
    it.each(["name", "email", "message"])("asks for %s", (field) => {
      expect(messageOf({ ...VALID, [field]: "   " }, field)).toBe(
        MESSAGES.required,
      );
    });
  });

  describe("email", () => {
    it.each([
      "taro@",
      "taro",
      "@example.com",
      "taro@example",
      "a b@example.com",
    ])("rejects %s", (email) => {
      expect(messageOf({ ...VALID, email }, "email")).toBe(MESSAGES.email);
    });

    it("accepts an address with a plus tag and a sub-domain", () => {
      expect(
        schema.safeParse({ ...VALID, email: "taro+a@mail.example.co.jp" })
          .success,
      ).toBe(true);
    });
  });

  describe("line breaks and control characters (they could slip lines into a mail)", () => {
    it.each(["name", "email", "company"])(
      "rejects a line break in %s",
      (field) => {
        const value =
          field === "email" ? "a@example.com\nBcc: x@example.com" : "a\nBcc: x";
        expect(messageOf({ ...VALID, [field]: value }, field)).toBeDefined();
      },
    );

    it.each([
      ["tab", "a\tb"],
      ["carriage return", "a\rb"],
      ["delete", "a\u007fb"],
    ])("rejects a %s in the name", (_label, name) => {
      expect(messageOf({ ...VALID, name }, "name")).toBe(MESSAGES.singleLine);
    });

    it("allows line breaks in the message", () => {
      expect(
        schema.safeParse({ ...VALID, message: "一行目\n二行目" }).success,
      ).toBe(true);
    });
  });

  describe("lengths", () => {
    it("accepts a name of 100 characters and rejects 101", () => {
      expect(
        schema.safeParse({ ...VALID, name: "あ".repeat(100) }).success,
      ).toBe(true);
      expect(messageOf({ ...VALID, name: "あ".repeat(101) }, "name")).toBe(
        MESSAGES.tooLong,
      );
    });

    it("accepts a message of 2000 characters and rejects 2001", () => {
      expect(
        schema.safeParse({ ...VALID, message: "あ".repeat(2000) }).success,
      ).toBe(true);
      expect(
        messageOf({ ...VALID, message: "あ".repeat(2001) }, "message"),
      ).toBe(MESSAGES.tooLong);
    });

    it("rejects a trap field longer than 200 characters", () => {
      expect(
        schema.safeParse({ ...VALID, website: "x".repeat(201) }).success,
      ).toBe(false);
    });
  });

  describe("topic and consent", () => {
    it("rejects a topic that is not offered", () => {
      expect(messageOf({ ...VALID, topic: "unknown" }, "topic")).toBe(
        MESSAGES.choose,
      );
    });

    it("rejects the empty topic of an untouched form", () => {
      expect(messageOf({ ...VALID, topic: "" }, "topic")).toBe(MESSAGES.choose);
    });

    it("requires consent", () => {
      expect(messageOf({ ...VALID, consent: false }, "consent")).toBe(
        MESSAGES.consent,
      );
    });
  });
});
