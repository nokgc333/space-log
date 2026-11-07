import type { ContactMail as MailCopy } from "@/lib/content";

import type { ContactValues } from "./contact-schema";

export type MailRoute = { from: string; to: string };

export type Mail = {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  text: string;
};

export function buildContactMail(
  values: ContactValues,
  { from, to }: MailRoute,
  topicLabel: string,
  copy: MailCopy,
): Mail {
  const { labels } = copy;
  const lines = [
    `${labels.name}: ${values.name}`,
    `${labels.email}: ${values.email}`,
    `${labels.company}: ${values.company || copy.empty}`,
    `${labels.topic}: ${topicLabel}`,
    `${labels.message}:`,
    values.message,
  ];
  return {
    from,
    to: [to],
    reply_to: values.email,
    subject: copy.subject,
    text: lines.join("\n"),
  };
}
