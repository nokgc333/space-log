# ADR-0008: Dependencies are updated by small steps, and some majors are held back on purpose

- Status: accepted (2026-10-26)
- Related: `.github/dependabot.yml`, `.github/workflows/security.yml`, `.github/branch-protection/`, `.nvmrc`

## Context

Old dependencies collect known vulnerabilities, and large jumps break builds. At the same time, a few packages cannot move because other tools require older versions.

## Decision

- Dependabot checks npm and GitHub Actions every Monday and groups minor and patch updates into one pull request. Nothing is merged automatically.
- Updates are made one at a time with the same npm version as the CI (pinned in `package.json` and `.nvmrc`), the lock file difference is read, and the whole suite runs after each step.
- Held back on purpose, with the reason:
  - `eslint` 9: the React, JSX accessibility and import plugins that Next.js bundles do not accept ESLint 10 yet.
  - `typescript` 6.0: `typescript-eslint` does not accept 6.1 or newer yet; Dependabot is told to skip them.
  - `@types/node` 24: the types follow the Node 24 runtime.
- Security checks run on every pull request and every week: `npm audit` for production dependencies (high and above fails), a review of the dependencies a pull request adds, and CodeQL. Secret scanning with push protection is on, and staged files are scanned before each commit.
- The main branch requires the five checks (build and unit tests, end-to-end tests, performance budget, dependency audit, CodeQL) and forbids force pushes and deletions. Administrators are not bound, so the only owner can always repair the repository; the checks still run on every pull request.
- The settings of the branch protection are kept in the repository as files and applied with `gh api`.

## Consequences

- Good: updates arrive in small, reviewed steps; vulnerabilities are found by machines; the reasons for held packages are written down.
- Bad: held packages fall behind until their plugins catch up; the pull request count is higher than with no automation.

## Alternatives considered

- Renovate: more settings, and it needs an app.
- Automatic merging of green updates: a green build does not read a changelog.

## Revisit when

The plugins accept ESLint 10 or TypeScript 7, or the Node baseline moves.
