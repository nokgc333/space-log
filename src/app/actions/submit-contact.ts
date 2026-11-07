"use server";

import { buildContactSchema } from "@/lib/contact/contact-schema";
import { contact } from "@/lib/content";

export type SubmitContactResult =
  | { ok: true; mode: "sent" | "demo" }
  | { ok: false; kind: "invalid"; errors: Record<string, string> }
  | { ok: false; kind: "rate-limited"; retryAfterSeconds: number }
  | { ok: false; kind: "failed" };

const schema = buildContactSchema(
  contact.messages,
  contact.topics.map((topic) => topic.value),
);

type Issue = { path: PropertyKey[]; message: string };

function firstMessages(issues: readonly Issue[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const name = String(issue.path[0] ?? "");
    if (name && !(name in errors)) errors[name] = issue.message;
  }
  return errors;
}

export async function submitContact(
  input: unknown,
): Promise<SubmitContactResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      kind: "invalid",
      errors: firstMessages(parsed.error.issues),
    };
  }
  if (parsed.data.website !== "") return { ok: true, mode: "demo" };
  console.warn(
    "Contact mail is not configured: the entry was accepted but not sent (demo mode).",
  );
  return { ok: true, mode: "demo" };
}
