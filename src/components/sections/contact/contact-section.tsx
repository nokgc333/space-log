import { submitContact } from "@/app/actions/submit-contact";
import { SectionFrame } from "@/components/ui/section-frame";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Contact } from "@/lib/content";

import { ContactForm } from "./contact-form";

export function ContactSection({ contact }: { contact: Contact }) {
  return (
    <SectionFrame id="contact">
      <SectionHeading id="contact-title" heading={contact.heading} />
      <ContactForm contact={contact} submit={submitContact} />
    </SectionFrame>
  );
}
