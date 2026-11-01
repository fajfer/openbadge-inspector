<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ADR-015: Remove eval paths from dependencies at build time

- **Status:** Accepted
- **Date:** 2026-11-02
- **Evidence:** `web-ext lint` reported `DANGEROUS_EVAL` in all three bundles before the change
- **Supersedes:** none

## Context

Zod 4 probes for `new Function` support, and `rdf-canonize` pulls in the `setimmediate` polyfill, which accepts
strings as code. MV3's CSP blocks both at runtime, but AMO reviewers flag them, and the code shouldn't be there.

## Decision

`scripts/build.ts` has a Vite plugin that replaces the `setimmediate` module with a small `setTimeout` shim, and
patches Zod's probe to report that eval is unavailable. The patch fails the build if the expected code is missing,
so a dependency upgrade can't silently undo it.

## Consequences

`web-ext lint` has no eval warnings. Zod runs in its non-JIT mode. Upgrading Zod or `rdf-canonize` may need the
patch adjusted.

## Related files

- `scripts/build.ts`
