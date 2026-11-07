# ADR-0003: The contact form is rate limited in memory

- Status: accepted (2026-10)
- Related: `src/lib/security/rate-limit.ts`, `src/app/actions/submit-contact.ts`

## Context

The contact form sends mail, so repeated posts could use up the sending quota or flood the inbox. The site is small and has no data store.

## Decision

- A sliding window of attempt times is kept per visitor in a `Map`: 5 attempts in 10 minutes. A wrong entry counts as an attempt. When the limit is reached, the answer carries the number of seconds to wait.
- The visitor is identified by the first address of `x-forwarded-for`, then `x-real-ip`; visitors without either share one `unknown` key.
- **Assumption:** this is only sound behind a host that sets these headers itself. On Vercel the platform writes the connecting address into `x-forwarded-for`, so a visitor cannot choose the first address. Behind a proxy that passes the visitor's own header through, a visitor could send a new first address with every request and never reach the limit. Before moving the site to such a host, switch to the address that the host guarantees. Tests pin that the first address is the one counted: later addresses in the list do not give a visitor a new allowance, and without any header all visitors share one key.
- The map holds at most 5,000 visitors. When it is full, the visitor who has been idle the longest is dropped; expired visitors always come first, so no separate cleanup is needed.
- The server action does not trust its caller: it also checks the limit, validates the input again with the same schema, ignores entries that fill the hidden trap field and checks the mail settings.

## Consequences

- Good: no dependency and no external service; about 50 lines, fully tested with an injectable clock.
- Bad: on a serverless host every instance has its own counter, and a cold start clears it, so a distributed attack is not stopped. The forwarded address is only reliable behind a trusted proxy.
- Backed up by the limits on field lengths, the trap field, the server-side validation and the quota of the mail service.

## Alternatives considered

- A shared store (Redis, a key-value service): exact, but it adds an account and a setting for a site of this size.
- A CAPTCHA: more effort for visitors; the trap field and the limit are enough for now.

## Revisit when

Abuse is observed or the traffic grows. Only the implementation of the limiter needs to change; the caller keeps the same call.
