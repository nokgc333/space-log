"use client";

import { useId, useState } from "react";
import { useForm } from "react-hook-form";

import type { SubmitContactResult } from "@/app/actions/submit-contact";
import {
  buildContactSchema,
  type ContactValues,
} from "@/lib/contact/contact-schema";
import { schemaResolver } from "@/lib/contact/schema-resolver";
import type { Contact } from "@/lib/content";
import { PRIVACY_PATH } from "@/lib/routes";

import { ConsentText } from "./consent-text";

type Props = {
  contact: Contact;
  submit: (values: ContactValues) => Promise<SubmitContactResult>;
};
type Outcome = { tone: "status" | "alert"; text: string } | null;

const EMPTY_VALUES: ContactValues = {
  name: "",
  email: "",
  company: "",
  topic: "",
  message: "",
  consent: false,
  website: "",
};
const LABEL = "font-mono text-xs tracking-widest";
const INPUT =
  "mt-2 w-full border border-control bg-surface px-3 py-2 outline-none focus:border-ink";
const SELECT =
  "w-full appearance-none border border-control bg-surface px-3 py-2 pr-10 outline-none focus:border-ink";

export function ContactForm({ contact, submit }: Props) {
  const consentNoteId = useId();
  const [outcome, setOutcome] = useState<Outcome>(null);
  const schema = buildContactSchema(
    contact.messages,
    contact.topics.map((topic) => topic.value),
  );
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: schemaResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  async function onValid(values: ContactValues) {
    setOutcome(null);
    let result: SubmitContactResult;
    try {
      result = await submit(values);
    } catch {
      result = { ok: false, kind: "failed" };
    }
    if (result.ok) {
      reset(EMPTY_VALUES);
      setOutcome({
        tone: "status",
        text:
          result.mode === "sent" ? contact.results.sent : contact.results.demo,
      });
      return;
    }
    if (result.kind === "invalid") {
      for (const [name, message] of Object.entries(result.errors)) {
        setError(name as keyof ContactValues, { message });
      }
      return;
    }
    setOutcome({
      tone: "alert",
      text:
        result.kind === "rate-limited"
          ? contact.results.rateLimited
          : contact.results.failed,
    });
  }

  const errorId = (name: keyof ContactValues) => `contact-${name}-error`;
  const fieldError = (name: keyof ContactValues) =>
    errors[name]?.message ? (
      <p id={errorId(name)} className="mt-1 text-xs text-signal">
        {errors[name]?.message}
      </p>
    ) : null;
  const a11y = (name: keyof ContactValues) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? errorId(name) : undefined,
  });

  return (
    <form
      onSubmit={handleSubmit(onValid)}
      noValidate
      className="flex flex-col gap-5"
    >
      <div>
        <label htmlFor="contact-name" className={LABEL}>
          {contact.fields.name}
        </label>
        <input
          id="contact-name"
          autoComplete="name"
          className={INPUT}
          {...a11y("name")}
          {...register("name")}
        />
        {fieldError("name")}
      </div>
      <div>
        <label htmlFor="contact-email" className={LABEL}>
          {contact.fields.email}
        </label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          className={INPUT}
          {...a11y("email")}
          {...register("email")}
        />
        {fieldError("email")}
      </div>
      <div>
        <label htmlFor="contact-company" className={LABEL}>
          {contact.fields.company}{" "}
          <span className="text-muted">({contact.optionalMark})</span>
        </label>
        <input
          id="contact-company"
          autoComplete="organization"
          className={INPUT}
          {...a11y("company")}
          {...register("company")}
        />
        {fieldError("company")}
      </div>
      <div>
        <label htmlFor="contact-topic" className={LABEL}>
          {contact.fields.topic}
        </label>
        <div className="relative mt-2">
          <select
            id="contact-topic"
            className={SELECT}
            {...a11y("topic")}
            {...register("topic")}
          >
            <option value="" disabled>
              —
            </option>
            {contact.topics.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 12 8"
            className="pointer-events-none absolute top-1/2 right-[calc(0.75rem+1px)] h-2 w-3 -translate-y-1/2 text-ink"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 1.5 6 6.5l5-5" />
          </svg>
        </div>
        {fieldError("topic")}
      </div>
      <div>
        <label htmlFor="contact-message" className={LABEL}>
          {contact.fields.message}
        </label>
        <textarea
          id="contact-message"
          rows={6}
          className={INPUT}
          {...a11y("message")}
          {...register("message")}
        />
        {fieldError("message")}
      </div>
      <div aria-hidden="true" className="hidden">
        <input tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm max-lg:justify-center max-lg:text-center">
          <input
            type="checkbox"
            {...a11y("consent")}
            {...register("consent")}
          />
          <span>
            <ConsentText
              text={contact.fields.consent}
              linkText={contact.consentLink.text}
              href={PRIVACY_PATH}
              describedBy={consentNoteId}
            />
          </span>
        </label>
        <span id={consentNoteId} hidden>
          {contact.consentLink.note}
        </span>
        {fieldError("consent")}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start border border-ink bg-ink px-6 py-3 font-mono text-xs tracking-widest text-surface disabled:opacity-60 max-lg:self-center"
      >
        {isSubmitting ? contact.sending : contact.submit}
      </button>
      {outcome ? (
        <p
          role={outcome.tone}
          className={
            outcome.tone === "alert" ? "text-sm text-signal" : "text-sm"
          }
        >
          {outcome.text}
        </p>
      ) : null}
    </form>
  );
}
