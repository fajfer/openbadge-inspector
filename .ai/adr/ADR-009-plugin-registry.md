<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ADR-009: Plug-in registry for extractors, formats and verifiers

- **Status:** Accepted
- **Date:** 2026-11-01
- **Evidence:** maintainer decision during the project questionnaire, 2026-11-01
- **Supersedes:** none

## Context

Openmercato guidance: Open-Closed Principle, context-first modular design. New badge versions, encodings or checks should not change the core pipeline.

## Decision

`src/registry` defines the interfaces `Extractor` (bytes/element → raw payload), `FormatParser` (raw payload → `BadgeSummary`) and `Verifier` (`BadgeSummary` + context → `VerificationCheck[]`), plus registration functions. The pipeline `inspect(image)` runs every matching extractor, then the first format parser that accepts the payload, then all verifiers that apply. Modules register themselves in one composition file, `src/registry/defaults.ts`; dependencies such as `fetch` and `now` are passed in, not imported.

## Consequences

Adding OB 4.0 or a new check means adding a module and one line in `defaults.ts`. Modules don't import each other except through `registry` types. Tests construct a registry with fakes.

## Related files

- `src/registry/`
