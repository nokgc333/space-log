import * as z from "zod/mini";

import type { ContactMessages } from "@/lib/content";

z.config({ jitless: true });

const MAX_SHORT_TEXT = 100;
const MAX_LONG_TEXT = 2000;
const MAX_TRAP_TEXT = 200;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SINGLE_LINE_PATTERN = /^[^\u0000-\u001f\u007f]*$/;

export function buildContactSchema(
  messages: ContactMessages,
  topicValues: readonly string[],
) {
  const shortText = (...extra: z.core.$ZodCheck<string>[]) =>
    z
      .string()
      .check(
        z.trim(),
        z.maxLength(MAX_SHORT_TEXT, messages.tooLong),
        z.regex(SINGLE_LINE_PATTERN, messages.singleLine),
        ...extra,
      );

  return z.object({
    name: shortText(z.minLength(1, messages.required)),
    email: shortText(
      z.minLength(1, messages.required),
      z.regex(EMAIL_PATTERN, messages.email),
    ),
    company: shortText(),
    topic: z
      .string()
      .check(z.refine((value) => topicValues.includes(value), messages.choose)),
    message: z
      .string()
      .check(
        z.trim(),
        z.minLength(1, messages.required),
        z.maxLength(MAX_LONG_TEXT, messages.tooLong),
      ),
    consent: z.boolean().check(z.refine((value) => value, messages.consent)),
    website: z._default(z.string().check(z.maxLength(MAX_TRAP_TEXT)), ""),
  });
}

export type ContactValues = z.infer<ReturnType<typeof buildContactSchema>>;
