<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# registry: interfaces and the inspection pipeline

> Status: planned. Nothing here is implemented yet; the [v1 spec](../../.ai/specs/2026-11-01-v1-mvp.md) builds it. Update this file when the code differs.

## Purpose

Shared types and the `inspect` pipeline that connects extractors, format parsers and verifiers without them
importing each other ([ADR-009](../../.ai/adr/ADR-009-plugin-registry.md)).

## Files

- `types.ts`: `ImageSource` (`{ kind: 'bytes', mime, bytes }` or `{ kind: 'svg-document', document }`),
  `RawPayload` (`{ encoding: 'url' | 'json' | 'jws' | 'jwt', value, container: 'png-itxt' | 'svg' }`),
  `ExtractResult` (`baked` with payloads / `not-baked` / `error` with reason), `BadgeSummary`,
  `VerificationCheck` (`{ id, status: 'pass' | 'fail' | 'not-run', reasonKey, details? }`), `BadgeStatus`
  (`verified` | `unverified` | `expired` | `invalid` | `not-baked`).
- `registry.ts`: `createRegistry()`, `registerExtractor`, `registerFormat`, `registerVerifier`.
- `inspect.ts`: `inspect(source, context)` → `InspectionResult`; `deriveStatus(checks)` maps checks to a
  `BadgeStatus`.
- `context.ts`: `InspectionContext` = `{ now: Date, mode: 'offline' | 'online', fetchJson?, fetchBytes? }`.
- `defaults.ts`: the only place that lists the built-in modules.

## Contracts

- `Extractor`: `{ id, accepts(source): boolean, extract(source): ExtractResult }`. Pure, synchronous on bytes.
- `FormatParser`: `{ id: 'ob2' | 'ob3', accepts(payload): boolean, parse(payload): ParseResult }`.
- `Verifier`: `{ id, appliesTo(summary, mode): boolean, verify(summary, context): Promise<VerificationCheck[]> }`.
- Status derivation: any `fail` other than `not-expired` → `invalid`; only `not-expired` fails → `expired`; all required checks `pass` including a signature or hosted check →
  `verified`; otherwise `unverified`.
- `fetchJson`/`fetchBytes` exist in the context only in `online` mode, so offline verifiers can't make requests.

## How to

- **Add a module**: implement the interface in its own folder, add one `register*` line in `defaults.ts`, add a test
  that builds a registry containing only that module.

## Validate

`npx vitest run src/registry`
