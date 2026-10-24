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
  describe("checking the entry in the browser", () => {
    it("asks for every required field and sends nothing", async () => {
      const submit = setup();
      await send();
      expect(
        await screen.findAllByText(CONTACT.messages.required),
      ).toHaveLength(3);
      expect(screen.getByText(CONTACT.messages.choose)).toBeInTheDocument();
      expect(screen.getByText(CONTACT.messages.consent)).toBeInTheDocument();
      expect(submit).not.toHaveBeenCalled();
    });

    it("shows the message of a wrong email and does not send", async () => {
      const submit = setup();
      await fillValid();
      await userEvent.clear(field("email"));
      await userEvent.type(field("email"), "taro@");
      await send();
      expect(
        await screen.findByText(CONTACT.messages.email),
      ).toBeInTheDocument();
      expect(submit).not.toHaveBeenCalled();
    });

    it("marks the wrong field and links it to its message", async () => {
      setup();
      await send();
      const name = field("name");
      await screen.findAllByText(CONTACT.messages.required);
      expect(name).toHaveAttribute("aria-invalid", "true");
      const messageId = name.getAttribute("aria-describedby");
      expect(messageId).toBeTruthy();
      expect(document.getElementById(messageId as string)).toHaveTextContent(
        CONTACT.messages.required,
      );
    });

    it("leaves the optional company empty without a complaint", async () => {
      const submit = setup();
      await fillValid();
      await send();
      await screen.findByRole("status");
      expect(submit).toHaveBeenCalledTimes(1);
      expect(field("company")).toHaveAttribute("aria-invalid", "false");
    });
  });

  describe("what is sent", () => {
    it("hands over the checked values, trimmed, with the trap field empty", async () => {
      const submit = setup();
      await userEvent.type(field("name"), "  山田  ");
      await userEvent.type(field("email"), "taro@example.com");
      await userEvent.selectOptions(field("topic"), "tools");
      await userEvent.type(field("message"), "相談です");
      await userEvent.click(field("consent"));
      await send();
      await screen.findByRole("status");
      expect(submit).toHaveBeenCalledWith({
        name: "山田",
        email: "taro@example.com",
        company: "",
        topic: "tools",
        message: "相談です",
        consent: true,
        website: "",
      });
    });

    it("hides the trap field from people", () => {
      setup();
      const trap = document.querySelector(
        'input[name="website"]',
      ) as HTMLElement;
      expect(trap).toHaveAttribute("tabindex", "-1");
      expect(trap).toHaveAttribute("autocomplete", "off");
      expect(trap.parentElement).toHaveAttribute("aria-hidden", "true");
      expect(trap.parentElement).toHaveClass("hidden");
      expect(screen.queryByLabelText(/website/i)).toBeNull();
    });
  });

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

    it("empties the form after a successful send", async () => {
      setup({ ok: true, mode: "sent" });
      await fillValid();
      await send();
      await screen.findByRole("status");
      expect(field("name")).toHaveValue("");
      expect(field("message")).toHaveValue("");
      expect(field("consent")).not.toBeChecked();
    });

    it("asks to wait when too many were sent", async () => {
      setup({ ok: false, kind: "rate-limited", retryAfterSeconds: 30 });
      await fillValid();
      await send();
      expect(await screen.findByRole("alert")).toHaveTextContent(
        CONTACT.results.rateLimited,
      );
    });

    it("keeps what was typed and explains when sending fails", async () => {
      setup({ ok: false, kind: "failed" });
      await fillValid();
      await send();
      expect(await screen.findByRole("alert")).toHaveTextContent(
        CONTACT.results.failed,
      );
      expect(field("name")).toHaveValue("山田 太郎");
      expect(field("message")).toHaveValue("相談です");
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

    it("shows the server's messages at the fields it found wrong", async () => {
      setup({
        ok: false,
        kind: "invalid",
        errors: { email: "server: bad email" },
      });
      await fillValid();
      await send();
      expect(await screen.findByText("server: bad email")).toBeInTheDocument();
      expect(field("email")).toHaveAttribute("aria-invalid", "true");
    });

    it("clears the last answer as soon as it sends again", async () => {
      let finish: (value: SubmitContactResult) => void = () => {};
      const submit = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, kind: "failed" })
        .mockReturnValueOnce(
          new Promise<SubmitContactResult>((resolve) => {
            finish = resolve;
          }),
        );
      render(<ContactForm contact={CONTACT} submit={submit} />);
      await fillValid();
      await send();
      await screen.findByRole("alert");
      await send();
      await screen.findByRole("button", { name: CONTACT.sending });
      expect(screen.queryByRole("alert")).toBeNull();
      finish({ ok: true, mode: "demo" });
      await screen.findByRole("status");
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

  describe("the fields", () => {
    it("offers the topics, with an unchosen first entry", () => {
      setup();
      const options = Array.from(
        (field("topic") as HTMLSelectElement).options,
      ).map((option) => option.value);
      expect(options).toEqual(["", "pipeline", "tools"]);
      expect((field("topic") as HTMLSelectElement).value).toBe("");
    });

    it("marks the company as optional", () => {
      setup();
      expect(screen.getByText(`(${CONTACT.optionalMark})`)).toBeInTheDocument();
    });

    it("lets the browser fill in the usual details", () => {
      setup();
      expect(field("name")).toHaveAttribute("autocomplete", "name");
      expect(field("email")).toHaveAttribute("autocomplete", "email");
      expect(field("email")).toHaveAttribute("type", "email");
      expect(field("company")).toHaveAttribute("autocomplete", "organization");
    });
  });

  describe("consent", () => {
    it("links the privacy policy inside the consent label", () => {
      setup();
      const link = screen.getByRole("link", { name: "privacy policy" });
      expect(link).toHaveAttribute("href", "/privacy");
      expect(link.closest("label")).toContainElement(field("consent"));
    });

    it("describes the link by the new tab note without showing it", () => {
      setup();
      const link = screen.getByRole("link", { name: "privacy policy" });
      expect(link).toHaveAccessibleDescription("(opens in a new tab)");
      expect(screen.getByText("(opens in a new tab)")).not.toBeVisible();
    });

    it("keeps the checkbox and the whole sentence as the only two items of the label", () => {
      setup();
      const label = screen
        .getByRole("link", { name: "privacy policy" })
        .closest("label");
      expect(label?.childNodes).toHaveLength(2);
    });

    it("keeps the label text exactly the sentence", () => {
      setup();
      expect(
        screen.getByRole("link", { name: "privacy policy" }).closest("label")
          ?.textContent,
      ).toBe("I agree to the privacy policy");
    });

    it("keeps the checkbox named by the whole sentence, without the new tab note", () => {
      setup();
      expect(
        screen.getByRole("checkbox", { name: "I agree to the privacy policy" }),
      ).toBeInTheDocument();
    });
  });
});
