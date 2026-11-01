<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# verifiers: offline and online checks

## Purpose

Produce `VerificationCheck`s for a `BadgeSummary`. Offline checks always run; online checks only after the user clicks
*Verify online* with the setting on ([ADR-005](../../.ai/adr/ADR-005-offline-first-verification.md)).

## Files

- `offline/schema.ts`, `offline/dates.ts` (5-minute clock skew), `offline/authenticity.ts` (Data Integrity and
  VC-JWT with `did:key` or an embedded JWK; OB 2.0 → `needs-online`), `offline/revocation.ts` (`needs-online`).
- `online/http.ts`: https only (also after redirects), 10 s timeout, 1 MiB cap, `credentials: "omit"`.
- `online/ob2-hosted.ts`: fetch the assertion, compare id/recipient/badge, `revoked` or HTTP 410, load badge class
  and issuer. `online/ob2-signed.ts`: key from `verification.creator`, key owner must be the issuer, revocation list.
- `online/ob3-authenticity.ts`: `did:web` and HTTPS verification methods (Multikey or JWK).
  `online/ob3-status.ts`: `BitstringStatusListEntry` / `StatusList2021Entry` and `1EdTechRevocationList`.
- `crypto/`: `keys.ts`, `signatures.ts` (WebCrypto only), `canonicalize.ts` (JCS, RDFC-1.0 through `jsonld`),
  `data-integrity.ts` (`hashData`, `verifyDataIntegrity`).
- `contexts/`: bundled JSON-LD contexts and the offline document loader
  ([ADR-014](../../.ai/adr/ADR-014-bundled-jsonld-canonicalisation.md)).

## Contracts

- Never read the clock (use `context.now`) and never call `fetch` (use `context.http`).
- A check that can't run returns `not-run` with a reason; verifiers don't throw.
- Ed25519 uses native WebCrypto (Firefox 129+, minimum ESR 140, [ADR-007](../../.ai/adr/ADR-007-mv3-desktop-esr.md)).

## Gotchas

- `crypto/data-integrity.test.ts` checks both cryptosuites against the W3C `vc-di-eddsa` test vectors. Keep it green.
- An unknown `@context` gives `not-run` / `unknown-context`, never a fetch. Add new contexts to `contexts/loader.ts`
  and `REUSE.toml`.
- Status lists are not signature-checked yet.

## Validate

`npx vitest run src/verifiers`
