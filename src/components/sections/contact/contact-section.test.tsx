import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Contact } from "@/lib/content";

const submitContact = vi.hoisted(() => vi.fn());
vi.mock("@/app/actions/submit-contact", () => ({ submitContact }));

import { ContactSection } from "./contact-section";

const CONTACT = {
  heading: { label: "05 / CONTACT", title: "CONTACT", subtitle: "sub" },
  fields: {
    name: "Name",
    email: "Email",
    company: "Company",
    topic: "Topic",
    message: "Message",
    consent: "I agree",
  },
  optionalMark: "optional",
  topics: [{ value: "pipeline", label: "Pipeline" }],
  submit: "Send",
  sending: "Sending",
  results: { sent: "s", demo: "d", rateLimited: "r", failed: "f" },
  messages: {
    required: "a",
    tooLong: "b",
    email: "c",
    singleLine: "d",
    choose: "e",
    consent: "f",
  },
  mail: {
    subject: "s",
    labels: { name: "n", email: "e", company: "c", topic: "t", message: "m" },
    empty: "-",
  },
} satisfies Contact;

describe("ContactSection", () => {
  it("is a region named by its heading, with the id the shortcut points at", () => {
    render(<ContactSection contact={CONTACT} />);
    expect(screen.getByRole("region", { name: "CONTACT" })).toHaveAttribute(
      "id",
      "contact",
    );
  });

  it("holds the form", () => {
    render(<ContactSection contact={CONTACT} />);
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("sends the entry through the Server Action", async () => {
    submitContact.mockResolvedValue({ ok: true, mode: "demo" });
    render(<ContactSection contact={CONTACT} />);
    await userEvent.type(screen.getByLabelText(/^Name/), "山田");
    await userEvent.type(screen.getByLabelText(/^Email/), "taro@example.com");
    await userEvent.selectOptions(screen.getByLabelText(/^Topic/), "pipeline");
    await userEvent.type(screen.getByLabelText(/^Message/), "相談です");
    await userEvent.click(screen.getByLabelText(/^I agree/));
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByRole("status");
    expect(submitContact).toHaveBeenCalledTimes(1);
    expect(submitContact).toHaveBeenCalledWith(
      expect.objectContaining({ name: "山田", topic: "pipeline" }),
    );
  });
});
