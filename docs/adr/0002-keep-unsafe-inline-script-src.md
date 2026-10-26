# ADR-0002: The script policy keeps `'unsafe-inline'`

- Status: accepted (2026-10-26, after measuring)
- Related: `src/lib/security/headers.ts`, `e2e/security.spec.ts`

## Context

Removing `'unsafe-inline'` from `script-src` makes cross-site scripting harder. A statically generated Next.js page contains inline scripts (the theme script, the bundler bootstrap and the server-rendered data), so a strict policy needs a nonce or hashes.

## Decision

`script-src 'self' 'unsafe-inline'` stays. The other directives stay strict (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`).

## Measurements (production build, local, median of 40 requests)

| Approach                                       | Home page    | Privacy page | Caching                                     |
| ---------------------------------------------- | ------------ | ------------ | ------------------------------------------- |
| Static pages, `'unsafe-inline'` (now)          | 1.6 ms       | 1.3 ms       | cacheable by a CDN                          |
| Nonce from `proxy.ts`                          | 5.9 ms       | 4.2 ms       | `no-store`, every page rendered per request |
| Hashes                                         | not possible | not possible |                                             |
| Subresource integrity with `script-src 'self'` | not usable   |              |                                             |

- A nonce works without violations once the theme provider receives it (the end-to-end policy checks pass), but it makes every page dynamic. On a serverless host that also adds start-up time and removes the edge cache.
- Of the four executable inline scripts per page, two (the bundler bootstrap and the server data) change with every build and every page. A static `headers()` cannot list their hashes.
- With subresource integrity the inline scripts of a static page are blocked.
- Style attributes cannot carry a nonce, so `style-src` could only be tightened for style elements, which gains little.

## Alternatives considered

The table above lists them: a nonce (works, but every page becomes dynamic), hashes (the scripts change per build and per page), subresource integrity (blocks the inline scripts of a static page) and a stricter `style-src` (style attributes cannot carry a nonce).

## Why this is acceptable

The pages show no visitor input: the contact form answers with fixed texts and the policy and the page texts come from the repository. There is no realistic route for injected markup, and the site is a showcase of speed that guards its budgets in CI.

## Consequences

- Good: static delivery and the performance budgets are kept.
- Bad: the policy gives no second line of defense against injected scripts.
- A check in the end-to-end suite opens the home page, the privacy page and the contact flow and fails on any policy violation.

## Revisit when

- A feature reflects visitor input or external content into the page, or a third-party script is added.
- A measurement on the real host shows that dynamic rendering is acceptable.
- Next.js supports hash-based policies for static pages.
