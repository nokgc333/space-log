# space-log

A one-page site for a fictional CG studio that specializes in Houdini and pipeline development.
The studio is made up, although the site is real and built to production standards.

## Screenshots

Hero (light theme):

![Hero in the light theme](screenshots/hero-light.png)

Hero (dark theme):

![Hero in the dark theme](screenshots/hero-dark.png)

Inversion:

![Inversion section](screenshots/inversion.png)

News:

![News section](screenshots/news.png)

Pipeline:

![Pipeline section with the log replay](screenshots/pipeline.png)

Tools:

![Tools section](screenshots/tools.png)

Contact:

![Contact section](screenshots/contact.png)

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack) and React 19.
- **Language:** TypeScript 5 in strict mode, for typed props, typed content and typed form values.
- **Styling:** Tailwind CSS v4 and `next-themes`.
- **Fonts:** IBM Plex Sans Condensed, IBM Plex Mono and IBM Plex Sans JP.
- **3D:** three.js and React Three Fiber, for the hero point cloud and its network of signals.
- **Content:** zod 4 and `yaml`.
- **Forms:** React Hook Form and zod, with client-side checks and the same schema again on the server.
- **Mail:** Resend through its REST API, optional; without settings the form runs in demo mode.
- **Unit tests:** Vitest, Testing Library and jsdom, for components, pure functions, content schemas and the server action.
- **E2E tests:** Playwright (Chromium), for layout, keyboard use, theme, reduced motion, the contact flow and response headers in a real browser.
- **Quality:** ESLint and Prettier, run locally and in CI.
- **CI:** GitHub Actions on Node 24.
- **Hosting:** Vercel.

## Scripts

- `npm run dev`: start the development server.
- `npm run check`: lint, typecheck, format check and unit tests.
- `npm run build`: build for production.
- `npm run test:e2e`: build, start on port 3100 and run Playwright.

## Content

Every word and number on the page lives in `content/`.
Components only receive typed props, and the content is validated with zod at build time.

Only the pages, the layout, and the news loader read, the contact server action `content/` directly.
The 3D colors and motion constants live in `src/components/scene/`.

## Design notes

- **Inverted space.**
- **One 3D scene, paid for only when seen.**
- **Content as data.**
- **Contact form without a mail account.**

## Environment variables

All optional. Without them the contact form runs in demo mode and nothing is sent.
Set all three to send real mail; setting only some makes the form report a failure and the server log name what is missing.

- `RESEND_API_KEY`
- `CONTACT_MAIL_FROM`
- `CONTACT_MAIL_TO`

Put them in `.env.local` (git-ignored) for local use, or in the host's environment settings.
`.env.example` lists the names.

## Accessibility

Lighthouse accessibility is 100 for the home page and the privacy page, in both themes.
The site works with the keyboard only (skip link, menu, stage buttons, table paging, form), and smooth scrolling and other animation follow the reduced-motion setting.

## Performance

Measured on a production build in Chrome on an Apple M2 (1440×900):

- 59–61 fps and no long tasks with the hero on screen, while the pointer moves over it, and scrolled down to the tools table, in both themes.
- Lighthouse: Performance 99–100 in repeated runs (the first run after a cold start scored lower), Best Practices 100, SEO 100.

## Security

- Response headers:
  Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.(The `X-Powered-By` header is off.)
- The contact form validates on the client and again on the server, rejects control characters in single-line fields, has a hidden trap field, and allows 5 sends per visitor per 10 minutes.
- `npm audit --omit=dev` reports no vulnerabilities in the production dependencies.
- The site sets no cookies and stores only the chosen theme in the browser.

## Credits

The GitHub mark in the tools table is the `mark-github` icon (16 px) from [Octicons](https://github.com/primer/octicons) 19.39.0, MIT License, Copyright (c) 2026 GitHub Inc.
It is used unmodified, in a single color, as a link to a repository.
The GitHub name and logo are trademarks of GitHub, Inc.

## License

MIT
