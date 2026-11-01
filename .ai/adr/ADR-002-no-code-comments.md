<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ADR-002: No comments in source code

- **Status:** Accepted
- **Date:** 2026-11-01
- **Evidence:** [PROMPT.md](../../PROMPT.md)
- **Supersedes:** none

## Context

PROMPT.md Q4.4: the owner asked that `AGENTS.md` forbid comments in code. Comments drift from the code; names, types and small functions should carry the meaning instead.

## Decision

Source files (`*.ts`, `*.css`, `*.html`, `*.mjs`) contain no comments other than the SPDX header at the top. This covers line and block comments, JSDoc, `TODO`/`FIXME`, commented-out code and `eslint-disable` directives. A `scripts/check-no-comments.ts` check (TypeScript scanner, so strings and regexes are not misread) runs as part of `npm run lint` and in CI. Markdown docs (`AGENTS.md`, ADRs, specs, README) are documentation, not code, and are exempt.

## Consequences

Explanations live in names, types, tests and the scoped `AGENTS.md` files. A lint suppression is not possible, so a rule that needs one is changed in `eslint.config.mjs` instead, with an ADR if it matters. Hard-to-explain code (e.g. PNG chunk parsing) gets well-named constants and helper functions.

## Related files

- `scripts/check-no-comments.ts`
- `eslint.config.mjs`
