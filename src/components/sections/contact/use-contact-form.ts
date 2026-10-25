import { useState } from "react";
import { useForm } from "react-hook-form";

import type { SubmitContactResult } from "@/app/actions/submit-contact";
import {
  buildContactSchema,
  type ContactValues,
} from "@/lib/contact/contact-schema";
import { schemaResolver } from "@/lib/contact/schema-resolver";
import type { Contact } from "@/lib/content";

export type Submit = (values: ContactValues) => Promise<SubmitContactResult>;
export type Outcome = { tone: "status" | "alert"; text: string } | null;

export const EMPTY_VALUES: ContactValues = {
  name: "",
  email: "",
  company: "",
  topic: "",
  message: "",
  consent: false,
  website: "",
};

async function sendSafely(
  submit: Submit,
  values: ContactValues,
): Promise<SubmitContactResult> {
  try {
    return await submit(values);
  } catch {
    return { ok: false, kind: "failed" };
  }
}

function outcomeOf(
  result: SubmitContactResult,
  results: Contact["results"],
): Outcome {
  if (result.ok) {
    return {
      tone: "status",
      text: result.mode === "sent" ? results.sent : results.demo,
    };
  }
  if (result.kind === "invalid") return null;
  return {
    tone: "alert",
    text: result.kind === "rate-limited" ? results.rateLimited : results.failed,
  };
}

export function useContactForm(contact: Contact, submit: Submit) {
  const [outcome, setOutcome] = useState<Outcome>(null);
  const schema = buildContactSchema(
    contact.messages,
    contact.topics.map((topic) => topic.value),
  );
  const form = useForm<ContactValues>({
    resolver: schemaResolver(schema),
    defaultValues: EMPTY_VALUES,
  });
  const { setError, reset } = form;

  async function onValid(values: ContactValues) {
    setOutcome(null);
    const result = await sendSafely(submit, values);
    if (result.ok) reset(EMPTY_VALUES);
    if (!result.ok && result.kind === "invalid") {
      for (const [name, message] of Object.entries(result.errors)) {
        setError(name as keyof ContactValues, { message });
      }
    }
    setOutcome(outcomeOf(result, contact.results));
  }

  return {
    register: form.register,
    onSubmit: form.handleSubmit(onValid),
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    outcome,
  };
}
