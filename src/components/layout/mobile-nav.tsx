"use client";

import { useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

type Props = {
  label: string;
  items: readonly { label: string; href: string }[];
};

export function MobileNav({ label, items }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== "Escape" || !isOpen) return;
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div className="lg:hidden" onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={label}
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex size-9 flex-col items-center justify-center gap-1.5 border border-control text-ink hover:bg-ink hover:text-surface"
      >
        <span aria-hidden="true" className="h-px w-4 bg-current" />
        <span aria-hidden="true" className="h-px w-4 bg-current" />
      </button>
      <nav
        id={panelId}
        aria-label={label}
        hidden={!isOpen}
        className="absolute inset-x-0 top-full border-b border-rule bg-surface"
      >
        <ul>
          {items.map((item) => (
            <li key={item.href} className="border-t border-rule">
              <a
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-4 font-mono text-sm text-ink hover:bg-ink hover:text-surface"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
