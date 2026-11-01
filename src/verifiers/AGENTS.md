<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# verifiers: offline and online checks

> Status: planned. Nothing here is implemented yet; the [v1 spec](../../.ai/specs/2026-11-01-v1-mvp.md) builds it. Update this file when the code differs.

## Purpose

Produce `VerificationCheck`s for a `BadgeSummary`. Offline checks always run. Online checks run only after the
user clicks *Verify online* with the setting enabled ([ADR-005](../../.ai/adr/ADR-005-offline-first-verification.md)).

## Files

- `offline/schema.ts`: turns the parse result into a `schema` check.
- `offline/dates.ts`: `issued-not-in-future`, `not-expired` against `context.now`.
- `offline/ob2-jws.ts`: JWS signature, only when the public key is embedded; otherwise `not-run` with reason
  `needs-online`.
- `offline/ob3-vc-jwt.ts`: VC-JWT (`EdDSA`, `ES256`, `RS256`) with `did:key` or an embedded JWK.
- `offline/ob3-data-integrity.ts`: `eddsa-rdfc-2022` / `eddsa-jcs-2022` proofs with `did:key`.
- `online/ob2-hosted.ts`: fetch the assertion URL, compare with the baked copy, resolve BadgeClass and Issuer.
- `online/ob2-revocation.ts`: issuer `revocationList`.
- `online/ob3-key-resolution.ts`: `did:web` and HTTPS verification methods.
- `online/ob3-status.ts`: `credentialStatus` (`1EdTechRevocationList`, `BitstringStatusListEntry`).
- `crypto/`: thin wrappers over `crypto.subtle`; nothing hand-rolled.
- `contexts/`: bundled JSON-LD contexts with their licence annotations, and the offline document loader.

## Contracts

- Never read the clock; use `context.now`.
- Never call `fetch` directly; use `context.fetchJson`/`fetchBytes`, which exist only in online mode. Online
  requests: `https:` only, 10 s timeout, 1 MiB response cap, no cookies (`credentials: 'omit'`).
- Each check has a stable `id` and an i18n `reasonKey`; a check that can't run returns `not-run` with a reason,
  never throws.

## Gotchas

- Ed25519 uses native `crypto.subtle` (Firefox 129+; the minimum is ESR 140, see
  [ADR-007](../../.ai/adr/ADR-007-mv3-desktop-esr.md)). No JS crypto library.
- `eddsa-rdfc-2022` uses the bundled `jsonld` + `rdf-canonize` with a document loader limited to
  `contexts/` ([ADR-014](../../.ai/adr/ADR-014-bundled-jsonld-canonicalisation.md)). Any other context URL
  → `not-run`, never a fetch.

## Validate

`npx vitest run src/verifiers`
