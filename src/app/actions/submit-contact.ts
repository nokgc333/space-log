"use server";

import { headers } from "next/headers";

import { buildContactMail } from "@/lib/contact/contact-mail";
import {
  buildContactSchema,
  type ContactValues,
} from "@/lib/contact/contact-schema";
import { type MailConfig, resolveMailConfig } from "@/lib/contact/mail-config";
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

type Failure = Extract<SubmitContactResult, { ok: false }>;
type Issue = { path: PropertyKey[]; message: string };

async function rateLimitFailure(): Promise<Failure | null> {
  const { allowed, retryAfterSeconds } = limiter.check(await visitorKey());
  return allowed
    ? null
    : { ok: false, kind: "rate-limited", retryAfterSeconds };
}

function firstMessages(issues: readonly Issue[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const name = String(issue.path[0] ?? "");
    if (name && !(name in errors)) errors[name] = issue.message;
  }
  return errors;
}

function loadMailConfig(): { config: MailConfig | null } | { failed: true } {
  try {
    return { config: resolveMailConfig(process.env) };
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Mail settings failed",
    );
    return { failed: true };
  }
}

function topicLabelOf(value: string): string {
  return contact.topics.find((topic) => topic.value === value)?.label ?? value;
}

async function deliver(values: ContactValues): Promise<SubmitContactResult> {
  const loaded = loadMailConfig();
  if ("failed" in loaded) return { ok: false, kind: "failed" };
  const { config } = loaded;
  if (config === null) {
    console.warn(
      "Contact mail is not configured: the entry was accepted but not sent (demo mode).",
    );
    return { ok: true, mode: "demo" };
  }
  try {
    await sendContactMail(
      config,
      buildContactMail(
        values,
        config,
        topicLabelOf(values.topic),
        contact.mail,
      ),
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Mail failed");
    return { ok: false, kind: "failed" };
  }
  return { ok: true, mode: "sent" };
}

export async function submitContact(
  input: unknown,
): Promise<SubmitContactResult> {
  const limited = await rateLimitFailure();
  if (limited) return limited;

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      kind: "invalid",
      errors: firstMessages(parsed.error.issues),
    };
  }
  if (parsed.data.website !== "") return { ok: true, mode: "demo" };
  return deliver(parsed.data);
}
