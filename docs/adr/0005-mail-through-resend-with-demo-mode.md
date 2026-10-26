# ADR-0005: Mail goes out through Resend, and the form runs in demo mode without settings

- Status: accepted (2026-10)
- Related: `src/lib/contact/`, `.env.example`

## Context

The studio in the page is fictional, so there is no real domain or inbox at first. The contact form should still work end to end and be shown, and it should be switched to real mail without a code change.

## Decision

- The mail is sent with one `fetch` call to the Resend REST API; no SDK is installed. The request has a timeout of 10 seconds.
- Three environment variables (`RESEND_API_KEY`, `CONTACT_MAIL_FROM`, `CONTACT_MAIL_TO`) are all-or-nothing:
  - none set: demo mode. The form answers that the entry was accepted and says it is a demo; nothing is sent, and the server log notes it.
  - all set: real sending.
  - only some set: the form reports a failure, and the server log names the missing variables, never a value.
- The subject and the labels of the mail come from the content files, not from the visitor, so a visitor cannot inject a header. Control characters are rejected in single-line fields.
- On a failure, only the status is logged: never the entry, the address or the key.

## Consequences

- Good: no dependency; the form can be shown without any account; switching to real mail needs only the three settings on the host.
- Bad: demo mode can hide a missing setting if nobody reads the answer; this is why the screen tells the visitor it is a demo.

## Alternatives considered

- The Resend SDK or an SMTP library: more code and dependencies for one request.
- A form service or a `mailto:` link: the first sends the data to another party, the second cannot be tested.

## Revisit when

A domain and an inbox exist and the form should always send; then demo mode can be limited to development.
