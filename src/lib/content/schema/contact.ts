import { z } from "zod";

import { sectionHeadingSchema, text } from "./common";

export const contactContentSchema = z
  .object({
    heading: sectionHeadingSchema,
    fields: z.object({
      name: text,
      email: text,
      company: text,
      topic: text,
      message: text,
      consent: text,
    }),
    consentLink: z.object({ text, note: text }),
    optionalMark: text,
    topics: z.array(z.object({ value: text, label: text })).min(1),
    submit: text,
    sending: text,
    results: z.object({
      sent: text,
      demo: text,
      rateLimited: text,
      failed: text,
    }),
    messages: z.object({
      required: text,
      tooLong: text,
      email: text,
      singleLine: text,
      choose: text,
      consent: text,
    }),
    mail: z.object({
      subject: text,
      labels: z.object({
        name: text,
        email: text,
        company: text,
        topic: text,
        message: text,
      }),
      empty: text,
    }),
  })
  .refine(
    (value) => value.fields.consent.includes(value.consentLink.text),
    "the consent sentence must contain the text to link",
  );

export type Contact = z.infer<typeof contactContentSchema>;
export type ContactMessages = Contact["messages"];
export type ContactMail = Contact["mail"];
