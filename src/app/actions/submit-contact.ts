"use server";

import { headers } from "next/headers";

import { buildContactMail } from "@/lib/contact/contact-mail";
import { buildContactSchema } from "@/lib/contact/contact-schema";
import { resolveMailConfig } from "@/lib/contact/mail-config";
import { sendContactMail } from "@/lib/contact/send-contact-mail";
import { contact } from "@/lib/content";
import { createRateLimiter } from "@/lib/security/rate-limit";

export type SubmitContactResult =
  | { ok: true; mode: "sent" | "demo" }
  | { ok: false; kind: "invalid"; errors: Record<string, string> }
  | { ok: false; kind: "rate-limited"; retryAfterSeconds: number }
  | { ok: false; kind: "failed" };

const ATTEMPT_LIMIT = 5;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const UNKNOWN_VISITOR = "unknown";

const limiter = createRateLimiter({
  limit: ATTEMPT_LIMIT,
  windowMs: ATTEMPT_WINDOW_MS,
});
const schema = buildContactSchema(
  contact.messages,
  contact.topics.map((topic) => topic.value),
);

async function visitorKey(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return forwarded || requestHeaders.get("x-real-ip") || UNKNOWN_VISITOR;
}

export async function submitContact(
  input: unknown,
): Promise<SubmitContactResult> {
  const { allowed, retryAfterSeconds } = limiter.check(await visitorKey());
  if (!allowed) return { ok: false, kind: "rate-limited", retryAfterSeconds };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const name = String(issue.path[0] ?? "");
      if (name && !(name in errors)) errors[name] = issue.message;
    }
    return { ok: false, kind: "invalid", errors };
  }
  if (parsed.data.website !== "") return { ok: true, mode: "demo" };

  let config;
  try {
    config = resolveMailConfig(process.env);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Mail settings failed",
    );
    return { ok: false, kind: "failed" };
  }
  if (config === null) {
    console.warn(
      "Contact mail is not configured: the entry was accepted but not sent (demo mode).",
    );
    return { ok: true, mode: "demo" };
  }

  const topicLabel =
    contact.topics.find((topic) => topic.value === parsed.data.topic)?.label ??
    parsed.data.topic;
  try {
    await sendContactMail(
      config,
      buildContactMail(parsed.data, config, topicLabel, contact.mail),
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Mail failed");
    return { ok: false, kind: "failed" };
  }
  return { ok: true, mode: "sent" };
}
