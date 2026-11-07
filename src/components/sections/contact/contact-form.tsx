"use client";

import type { ContactValues } from "@/lib/contact/contact-schema";
import type { Contact } from "@/lib/content";

import {
  ConsentField,
  MessageField,
  OutcomeMessage,
  TextField,
  TopicField,
} from "./contact-fields";
import { type Submit, useContactForm } from "./use-contact-form";

type Props = { contact: Contact; submit: Submit };

export function ContactForm({ contact, submit }: Props) {
  const { register, onSubmit, errors, isSubmitting, outcome } = useContactForm(
    contact,
    submit,
  );
  const errorOf = (name: keyof ContactValues) => errors[name]?.message;
  const fields = contact.fields;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <TextField
        name="name"
        label={fields.name}
        autoComplete="name"
        error={errorOf("name")}
        register={register}
      />
      <TextField
        name="email"
        label={fields.email}
        type="email"
        autoComplete="email"
        error={errorOf("email")}
        register={register}
      />
      <TextField
        name="company"
        label={
          <>
            {fields.company}{" "}
            <span className="text-muted">({contact.optionalMark})</span>
          </>
        }
        autoComplete="organization"
        error={errorOf("company")}
        register={register}
      />
      <TopicField
        name="topic"
        label={fields.topic}
        topics={contact.topics}
        error={errorOf("topic")}
        register={register}
      />
      <MessageField
        name="message"
        label={fields.message}
        error={errorOf("message")}
        register={register}
      />
      <div aria-hidden="true" className="hidden">
        <input tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      <ConsentField
        contact={contact}
        error={errorOf("consent")}
        register={register}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start border border-ink bg-ink px-6 py-3 font-mono text-xs tracking-widest text-surface disabled:opacity-60 max-lg:self-center"
      >
        {isSubmitting ? contact.sending : contact.submit}
      </button>
      <OutcomeMessage outcome={outcome} />
    </form>
  );
}
