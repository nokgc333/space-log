import type { Mail } from "./contact-mail";
import type { MailConfig } from "./mail-config";

const SEND_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 10_000;

export async function sendContactMail(
  { apiKey }: MailConfig,
  mail: Mail,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchFn(SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(mail),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(
      `Sending the contact mail failed with status ${response.status}`,
    );
  }
}
