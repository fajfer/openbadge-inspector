<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ADR-005: Offline-first verification; online checks only on an explicit click

- **Status:** Accepted
- **Date:** 2026-11-01
- **Evidence:** [PROMPT.md](../../PROMPT.md)
- **Supersedes:** none

## Context

PROMPT.md Q1.3, Q3.1, Q3.4. Online verification tells issuers which pages the user views. The owner chose: configurable, offline by default, network only on a per-badge click.

## Decision

Offline checks always run on a detected badge: schema validation (Zod), `issuedOn`/`expires` (OB2) and `validFrom`/`validUntil` (OB3) against an injected `now`, and signatures whose key is available without a network call (`did:key`, a JWK embedded in the payload). Online checks (OB2 hosted assertion fetch and comparison, issuer key/profile fetch, `did:web` resolution, OB2 `revocationList`, OB3 `credentialStatus`) exist only when the `onlineVerification` setting is on, and each runs only after the user clicks **Verify online** on that badge's card. Results are kept for the browser session only. Recipient identity is never matched: the card shows the recipient type and whether it is hashed.

## Consequences

Green (verified) without a click is only possible for offline-verifiable signatures; hosted OB2 badges stay yellow until verified online. Every check yields a `VerificationCheck` with status and reason, so the card can explain why something isn't verified. Any new network call needs the maintainer's approval.

## Related files

- `src/verifiers/offline/`
- `src/verifiers/online/`
- `src/settings/`
