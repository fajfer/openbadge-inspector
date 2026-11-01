<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# formats: OB 2.0 and OB 3.0 parsing

> Status: planned. Nothing here is implemented yet; the [v1 spec](../../.ai/specs/2026-11-01-v1-mvp.md) builds it. Update this file when the code differs.

## Purpose

Zod schemas for Open Badges 2.0 and 3.0, and normalisation of either version into a single `BadgeSummary` that the UI
and verifiers use.

## Files

- `ob2/assertion.schema.ts`, `ob2/badge-class.schema.ts`, `ob2/issuer.schema.ts`: 1EdTech OB 2.0 vocabulary.
- `ob2/parse.ts`: handles a hosted URL (summary with `needsOnline: true`, only the URL known), embedded JSON, and
  JWS (header + payload decoded, signature kept for verifiers).
- `ob3/credential.schema.ts`: `OpenBadgeCredential` / `AchievementCredential` (VC Data Model 2.0, with 1.1
  `issuanceDate`/`expirationDate` accepted as aliases).
- `ob3/parse.ts`: JSON-LD credential or compact VC-JWT.
- `summary.ts`: `BadgeSummary` builder: `specVersion`, `name`, `description`, `image`, `issuer { name, url, id }`,
  `issuedAt`, `expiresAt`, `recipient { type, hashed }`, `proof` (kind + raw), `sources` (for verifiers).

## Contracts

- `@context` decides the version: `https://w3id.org/openbadges/v2` → OB2; `https://purl.imsglobal.org/spec/ob/v3p0/context*.json` → OB3.
- Schemas are permissive on unknown fields (`.passthrough()`) and strict on the fields we display or verify.
- Embedded objects (BadgeClass, Issuer) may be inline objects or IRIs; an IRI leaves the field marked as
  needing an online lookup.
- A schema failure is a `ParseResult` error with a path, which the verifiers turn into a failing `schema` check.

## Validate

`npx vitest run src/formats`
