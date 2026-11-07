import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { SubmitContactResult } from "@/app/actions/submit-contact";
import type { Contact } from "@/lib/content";

import { ContactForm } from "./contact-form";

const CONTACT: Contact = {
  heading: { label: "05 / CONTACT", title: "CONTACT", subtitle: "sub" },
  fields: {
    name: "Name",
    email: "Email",
    company: "Company",
    topic: "Topic",
    message: "Message",
    consent: "I agree to the privacy policy",
  },
  consentLink: { text: "privacy policy", note: "(opens in a new tab)" },
  optionalMark: "optional",
  topics: [
    { value: "pipeline", label: "Pipeline" },
    { value: "tools", label: "Tools" },
  ],
  submit: "Send",
  sending: "Sending",
  results: {
    sent: "SENT!",
    demo: "DEMO!",
    rateLimited: "SLOW DOWN!",
    failed: "FAILED!",
  },
  messages: {
    required: "required!",
    tooLong: "too long!",
    email: "bad email!",
    singleLine: "one line only!",
    choose: "choose one!",
    consent: "consent needed!",
  },
  mail: {
    subject: "s",
    labels: { name: "n", email: "e", company: "c", topic: "t", message: "m" },
    empty: "-",
  },
};

const field = (name: keyof Contact["fields"]) =>
  screen.getByLabelText(new RegExp(`^${CONTACT.fields[name]}`));

async function fillValid() {
  await userEvent.type(field("name"), "山田 太郎");
  await userEvent.type(field("email"), "taro@example.com");
  await userEvent.selectOptions(field("topic"), "pipeline");
  await userEvent.type(field("message"), "相談です");
  await userEvent.click(field("consent"));
}

const send = () =>
  userEvent.click(screen.getByRole("button", { name: CONTACT.submit }));

function setup(
  result: SubmitContactResult | Error = { ok: true, mode: "demo" },
) {
  const submit =
    result instanceof Error
      ? vi.fn().mockRejectedValue(result)
      : vi.fn().mockResolvedValue(result);
  render(<ContactForm contact={CONTACT} submit={submit} />);
  return submit;
}

describe("ContactForm", () => {
  describe("the answer", () => {
    it("says nothing was really sent in demo mode", async () => {
      setup({ ok: true, mode: "demo" });
      await fillValid();
      await send();
      expect(await screen.findByRole("status")).toHaveTextContent(
        CONTACT.results.demo,
      );
    });

    it("says it was sent when it was", async () => {
      setup({ ok: true, mode: "sent" });
      await fillValid();
      await send();
      expect(await screen.findByRole("status")).toHaveTextContent(
        CONTACT.results.sent,
      );
    });

    it("treats a thrown network error like a failed send", async () => {
      setup(new Error("offline"));
      await fillValid();
      await send();
      expect(await screen.findByRole("alert")).toHaveTextContent(
        CONTACT.results.failed,
      );
      expect(field("name")).toHaveValue("山田 太郎");
    });
  });

  describe("while sending", () => {
    it("cannot be sent twice while the first one is on its way", async () => {
      let finish: (value: SubmitContactResult) => void = () => {};
      const submit = vi.fn().mockReturnValue(
        new Promise<SubmitContactResult>((resolve) => {
          finish = resolve;
        }),
      );
      render(<ContactForm contact={CONTACT} submit={submit} />);
      await fillValid();
      await send();
      const button = await screen.findByRole("button", {
        name: CONTACT.sending,
      });
      expect(button).toBeDisabled();
      await userEvent.click(button);
      expect(submit).toHaveBeenCalledTimes(1);
      finish({ ok: true, mode: "demo" });
      await screen.findByRole("status");
      expect(
        screen.getByRole("button", { name: CONTACT.submit }),
      ).toBeEnabled();
    });
  });
});
