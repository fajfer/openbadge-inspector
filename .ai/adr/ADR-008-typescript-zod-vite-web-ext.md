<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ADR-008: TypeScript, Zod, Vite and web-ext, no UI framework

- **Status:** Accepted
- **Date:** 2026-11-01
- **Evidence:** [PROMPT.md](../../PROMPT.md)
- **Supersedes:** none

## Context

PROMPT.md Q4.1. The openmercato guidance uses TypeScript and Zod as guardrails for generated code. The UI is one card and a few icons, so a framework isn't worth its size or AMO review cost.

## Decision

Strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`). Zod for every boundary. Vite builds each entry point (background, content, options) into `dist/` without code splitting across contexts. `web-ext` runs, lints, builds and signs. Plain DOM APIs for UI. npm with a committed lockfile. Node LTS in CI.

## Consequences

AMO reviewers need reproducible builds: the build must be deterministic and documented (`npm ci && npm run build`). Runtime dependencies are kept minimal and need approval.

## Related files

- `package.json`
- `tsconfig.json`
- `vite.config.ts`
