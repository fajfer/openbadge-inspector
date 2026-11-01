<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# registry: interfaces and the inspection pipeline

## Purpose

Shared types and the `inspectImage` pipeline that connects extractors, format parsers and verifiers without them
importing each other ([ADR-009](../../.ai/adr/ADR-009-plugin-registry.md)).

## Files

- `types.ts`: `ImageInput`, `RawPayload`, `ExtractResult`, `BadgeSummary`, `VerificationCheck` (`id`, `status`,
  `reason`, `detail?`), `InspectionContext` (`now`, `mode`, `http?`), `Verifier`, `BadgeStatus`, `InspectionResult`.
- `registry.ts`: `createRegistry()` builder with `registerExtractor`, `registerFormat`, `registerVerifier`.
- `inspect.ts`: `inspectImage(registry, input, context)` and `verifyPayload`. Offline verifiers always run; online
  verifiers run after them only when `context.mode === "online"`, and their checks replace offline ones by `id`.
- `status.ts`: `deriveStatus(checks)` and `mergeChecks` (display order: schema, authenticity, revocation, issued,
  expiry).
- `defaults.ts`: the only place that lists the built-in modules.

## Contracts

- Status: any `fail` other than `expiry` → `invalid`; only `expiry` fails → `expired`; `authenticity` passes →
  `verified`; otherwise `unverified`. `not-baked` and `unreadable` come from extraction.
- `context.http` is passed only in online mode, so offline verifiers can't make requests.
- An online verifier may return `summaryPatch` to fill in details it fetched (e.g. an OB 2.0 badge class).

## How to

- **Add a module**: implement the interface in its own folder, add one `register*` line in `defaults.ts`, and add
  a test (the fixture catalogue in `inspect.dom.test.ts` covers the whole pipeline).

## Validate

`npx vitest run src/registry`
