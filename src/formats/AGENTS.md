<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# formats: OB 2.0 and OB 3.0 parsing

## Purpose

Zod schemas for Open Badges 2.0 and 3.0, and normalisation of either into one `BadgeSummary` for the UI and verifiers.

## Files

- `ob2/assertion.schema.ts`, `ob2/badge-class.schema.ts`, `ob2/issuer.schema.ts`, `ob2/parse.ts`: hosted URL,
  assertion JSON and JWS. `summariseAssertion` is reused by online verifiers on fetched documents.
- `ob3/credential.schema.ts`, `ob3/parse.ts`: JSON-LD credential or compact VC-JWT (`vc` claim or the payload
  itself). VC 1.1 `issuanceDate`/`expirationDate` are accepted as aliases.
- `summary.ts` (`withDefined`, `unrecognisedSummary`), `dates.ts`, `schema-issues.ts` (first five issues with paths).

## Contracts

- The summary is built tolerantly from the raw JSON; the schema result only fills `schemaIssues`, which the
  `schema` check reports. A badge with schema issues is shown, but as invalid.
- OB 3.0 is detected by a VC or OB 3.0 `@context`; OB 2.0 by its `@context`, or by `recipient` + `badge` without one.
  OB 3.0 is registered first.

## Validate

`npx vitest run src/formats`
