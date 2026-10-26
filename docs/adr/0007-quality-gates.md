# ADR-0007: Limits on size and complexity, a coverage floor and checks before each commit and push

- Status: accepted (2026-10)
- Related: `eslint.config.mjs`, `vitest.config.mts`, `.husky/`, `docs/adr/`

## Context

A showcase repository is read, not only run. Long and tangled functions, untested corners and a red build cost the reader's trust.

## Decision

- ESLint fails on functions with a complexity above 10, more than 80 lines, nesting deeper than 4 or more than 4 parameters, and on source files longer than 200 lines. Test files are not counted.
- The unit tests run with coverage in the CI and fail below 95% for statements, branches, functions and lines. Only the font declarations and the root layout are left out, because the end-to-end tests check them.
- The logic of the 3D scene must not import React, three or Next.js (a test checks the imports), so it can be tested without a renderer.
- Before a commit, staged files are linted, formatted and scanned for secrets. Before a push, the quick checks run (lint, types, format, unit tests).
- A Linux run of the three CI jobs can be reproduced locally in a container, because a layout test once passed on macOS and failed on the CI (small letters are rounded differently).
- End-to-end tests that measure text widths must also pass with every letter about 10% wider.
- A failing check is investigated before any limit is loosened.
- The code carries almost no comments. The reasons for a choice live in these records and in the README, where they can be read and kept up to date, and the types and the tests document what the code does.

## Consequences

- Good: the limits are in code and in CI, not in a document; refactors are protected by tests that were written first.
- Bad: the checks take time (about 20 seconds before a push), and a few tests are long simulations with an explicit timeout.

## Alternatives considered

- Limits as guidelines only: they drift.
- A lower coverage floor: the remaining gaps are small, so a high floor costs little.

## Revisit when

A limit forces a worse structure than the code it replaces.
