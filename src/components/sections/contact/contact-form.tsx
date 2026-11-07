"use client";

import type { Contact } from "@/lib/content";
import { type Submit, useContactForm } from "./use-contact-form";

type Props = { contact: Contact; submit: Submit };

export function ContactForm({ contact, submit }: Props) {
  const { register, onSubmit, isSubmitting, outcome } = useContactForm(
    contact,
    submit,
  );
  const fields = contact.fields;
  return (
    <form onSubmit={onSubmit} noValidate>
      <label>
        {fields.name}
        <input {...register("name")} />
      </label>
      <label>
        {fields.email}
        <input type="email" {...register("email")} />
      </label>
      <label>
        {fields.company}
        <input {...register("company")} />
      </label>
      <label>
        {fields.topic}
        <select {...register("topic")}>
          <option value="" disabled>
            —
          </option>
          {contact.topics.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        {fields.message}
        <textarea {...register("message")} />
      </label>
      <label>
        <input type="checkbox" {...register("consent")} />
        {fields.consent}
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? contact.sending : contact.submit}
      </button>
      {outcome && <p role={outcome.tone}>{outcome.text}</p>}
    </form>
  );
}
