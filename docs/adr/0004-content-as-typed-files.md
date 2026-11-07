# ADR-0004: The texts live in typed files and are checked with schemas

- Status: accepted (2026-10)
- Related: `content/`, `src/lib/content/schema/`, `src/lib/news/`

## Context

The page has many texts, numbers and links. If they sit inside the components, changing a sentence means reading code, and a typo in a structure shows up only in the browser.

## Decision

- Every text, number and link of a section is in `content/` as a typed TypeScript object. Components only receive these objects as props and hold no copy of their own.
- Each file is validated with a zod schema, one schema file per section in `src/lib/content/schema/`. The objects are parsed when the module loads, so wrong content fails the build and the tests.
- News entries are Markdown files, one per entry (`content/news/YYYY-MM-DD-slug.md`) with a front matter of date, kind and text. They are read when the page is built, validated with the same kind of schema and sorted newest first. Adding an entry means adding one file.
- The texts the server needs to trust (the contact form messages and the mail subject) are also in `content/`; the server reads them from there, never from the request.
- The schemas run on the server only; the components import types, so zod is not sent to the browser for them.

## Consequences

- Good: a change of wording does not touch a component; the types follow the content; invalid content cannot be deployed.
- Bad: a change of text is a code change (a pull request), not an edit in a tool for editors.

## Alternatives considered

- A headless CMS or a git-based CMS: useful for editors, but this site has one author and a small amount of text.
- MDX for every section: the sections are structured data (lists, labels), not prose.
- JSON files: no types and no comments for the author, and the schema would have to be kept in step by hand.
- An i18n library: the site has one language.

## Revisit when

A second person edits the texts, or the site needs more than one language.
