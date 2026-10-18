export type MailConfig = { apiKey: string; from: string; to: string };

type Env = Record<string, string | undefined>;

const PLAIN_ADDRESS = /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/;
const NAMED_ADDRESS = /^[^<>\r\n]+<[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+>$/;
const REQUIRED = [
  "RESEND_API_KEY",
  "CONTACT_MAIL_FROM",
  "CONTACT_MAIL_TO",
] as const;

export function resolveMailConfig(env: Env): MailConfig | null {
  const present = REQUIRED.filter((name) => env[name]);
  if (present.length === 0) return null;

  const missing = REQUIRED.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Mail settings are incomplete, missing: ${missing.join(", ")}`,
    );
  }

  const apiKey = env.RESEND_API_KEY as string;
  const from = env.CONTACT_MAIL_FROM as string;
  const to = env.CONTACT_MAIL_TO as string;

  if (!PLAIN_ADDRESS.test(from) && !NAMED_ADDRESS.test(from)) {
    throw new Error("CONTACT_MAIL_FROM must be an address or Name <address>");
  }
  if (!PLAIN_ADDRESS.test(to)) {
    throw new Error("CONTACT_MAIL_TO must be one email address");
  }
  return { apiKey, from, to };
}
