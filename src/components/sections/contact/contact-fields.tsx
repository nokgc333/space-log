import type { ReactNode } from "react";
import type { UseFormRegister } from "react-hook-form";

import type { ContactValues } from "@/lib/contact/contact-schema";

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
  "mt-2 w-full border border-control bg-surface px-3 py-2 focus:border-ink";
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
