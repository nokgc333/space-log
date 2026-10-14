# space-log

A one-page site for a fictional CG studio that specialises in Houdini and pipeline development.
The studio, its tools, its jobs and its numbers are all made up; the site itself is real and built to production standards.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- React Three Fiber
- Vitest
- Playwright
- GitHub Actions
- Vercel

## Scripts

| Command            | What it does                                 |
| ------------------ | -------------------------------------------- |
| `npm run dev`      | Start the development server                 |
| `npm run check`    | Lint, typecheck, format check and unit tests |
| `npm run test:e2e` | Build, start on port 3100 and run Playwright |

## Content

Every word and number on the page lives in `content/`.
Components only receive typed props, and the content is validated with zod at build time.

## License

MIT
