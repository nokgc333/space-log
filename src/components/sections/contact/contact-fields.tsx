import { type ReactNode, useId } from "react";
import type { UseFormRegister } from "react-hook-form";

import type { ContactValues } from "@/lib/contact/contact-schema";
import type { Contact } from "@/lib/content";
import { PRIVACY_PATH } from "@/lib/routes";

import { ConsentText } from "./consent-text";
import type { Outcome } from "./use-contact-form";

type Name = keyof ContactValues;
type Register = UseFormRegister<ContactValues>;
type FieldProps = {
  name: Name;
  label: ReactNode;
  error?: string;
  register: Register;
};

const LABEL = "font-mono text-xs tracking-widest";
const INPUT =
  "mt-2 w-full border border-control bg-surface px-3 py-2 outline-none focus:border-ink";
const SELECT =
  "w-full appearance-none border border-control bg-surface px-3 py-2 pr-10 outline-none focus:border-ink";

const fieldId = (name: Name) => `contact-${name}`;
const errorId = (name: Name) => `contact-${name}-error`;

export function a11y(name: Name, error?: string) {
  return {
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? errorId(name) : undefined,
  };
}

export function FieldError({ name, error }: { name: Name; error?: string }) {
  return error ? (
    <p id={errorId(name)} className="mt-1 text-xs text-signal">
      {error}
    </p>
  ) : null;
}

type TextFieldProps = FieldProps & {
  type?: "email";
  autoComplete: string;
};

export function TextField({
  name,
  label,
  error,
  register,
  type,
  autoComplete,
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={fieldId(name)} className={LABEL}>
        {label}
      </label>
      <input
        id={fieldId(name)}
        type={type}
        autoComplete={autoComplete}
        className={INPUT}
        {...a11y(name, error)}
        {...register(name)}
      />
      <FieldError name={name} error={error} />
    </div>
  );
}

export function MessageField({ name, label, error, register }: FieldProps) {
  return (
    <div>
      <label htmlFor={fieldId(name)} className={LABEL}>
        {label}
      </label>
      <textarea
        id={fieldId(name)}
        rows={6}
        className={INPUT}
        {...a11y(name, error)}
        {...register(name)}
      />
      <FieldError name={name} error={error} />
    </div>
  );
}

type TopicFieldProps = FieldProps & { topics: Contact["topics"] };

export function TopicField({
  name,
  label,
  error,
  register,
  topics,
}: TopicFieldProps) {
  return (
    <div>
      <label htmlFor={fieldId(name)} className={LABEL}>
        {label}
      </label>
      <div className="relative mt-2">
        <select
          id={fieldId(name)}
          className={SELECT}
          {...a11y(name, error)}
          {...register(name)}
        >
          <option value="" disabled>
            —
          </option>
          {topics.map((topic) => (
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
      <FieldError name={name} error={error} />
    </div>
  );
}

type ConsentFieldProps = {
  contact: Contact;
  error?: string;
  register: Register;
};

export function ConsentField({ contact, error, register }: ConsentFieldProps) {
  const noteId = useId();
  return (
    <div>
      <label className="flex items-center gap-2 text-sm max-lg:justify-center max-lg:text-center">
        <input
          type="checkbox"
          {...a11y("consent", error)}
          {...register("consent")}
        />
        <span>
          <ConsentText
            text={contact.fields.consent}
            linkText={contact.consentLink.text}
            href={PRIVACY_PATH}
            describedBy={noteId}
          />
        </span>
      </label>
      <span id={noteId} hidden>
        {contact.consentLink.note}
      </span>
      <FieldError name="consent" error={error} />
    </div>
  );
}

export function OutcomeMessage({ outcome }: { outcome: Outcome }) {
  if (!outcome) return null;
  return (
    <p
      role={outcome.tone}
      className={outcome.tone === "alert" ? "text-sm text-signal" : "text-sm"}
    >
      {outcome.text}
    </p>
  );
}
