<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->

# ADR-018: Offline-first verification; a click on Verify online is the consent

- **Status:** Accepted
- **Date:** 2026-11-02
- **Evidence:** maintainer decision of 2026-11-02 after using the card on odznaka.reszka.org
- **Supersedes:** ADR-005

## Context

ADR-005 required both the `onlineVerification` setting and a click before contacting an issuer. In practice the card
showed "Needs an online check with the issuer" with no way to do it from there. Many issuers (e.g. BadgeFed) allow
cross-origin reads, so the extension can fetch their documents without any host permission; some (e.g. Credly's API)
don't.

## Decision

- Offline checks always run, as in ADR-005: schema, dates, and signatures whose key is available without a network
  call (`did:key`, an embedded JWK). Recipient identity is never matched.
- The card shows **Verify online** whenever an online verifier applies. The click is the consent: only then are the
  hosted assertion, badge class, issuer, keys (`did:web`, HTTPS) and revocation or status lists fetched, without
  cookies. Online results are not cached, so **Verify again** always refetches.
- If a request fails and Firefox has no host permission for that origin, the card names the issuer as blocking
  browser extensions and offers **Allow in settings** and **Verify again**.
- The setting is now `reachAllIssuers` ("Let online checks reach every issuer"). It only grants `<all_urls>`. When
  neither it nor `autoScan` is on, the extension gives `<all_urls>` back.

## Consequences

Users can verify a badge from the card in one click; issuers see that request. Any new kind of network call still
needs the maintainer's approval.

## Related files

- `src/ui/card.ts`, `src/background/inspection.ts`, `src/verifiers/online/http.ts`, `src/settings/`
