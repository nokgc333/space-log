import { z } from "zod";

import type { ContactMessages } from "@/lib/content";

const MAX_SHORT_TEXT = 100;
const MAX_LONG_TEXT = 2000;
const MAX_TRAP_TEXT = 200;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SINGLE_LINE_PATTERN = /^[^\u0000-\u001f\u007f]*$/;

export function buildContactSchema(
  messages: ContactMessages,
  topicValues: readonly string[],
) {
  const shortText = z
    .string()
    .trim()
    .max(MAX_SHORT_TEXT, messages.tooLong)
    .regex(SINGLE_LINE_PATTERN, messages.singleLine);

  return z.object({
    name: shortText.min(1, messages.required),
    email: shortText
      .min(1, messages.required)
      .regex(EMAIL_PATTERN, messages.email),
    company: shortText,
    topic: z
      .string()
      .refine((value) => topicValues.includes(value), messages.choose),
    message: z
      .string()
      .trim()
      .min(1, messages.required)
      .max(MAX_LONG_TEXT, messages.tooLong),
    consent: z.boolean().refine((value) => value, messages.consent),
    website: z.string().max(MAX_TRAP_TEXT).default(""),
  });
}

export type ContactValues = z.infer<ReturnType<typeof buildContactSchema>>;
