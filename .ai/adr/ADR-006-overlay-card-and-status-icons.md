<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ADR-006: Shadow-DOM overlay card, corner status icons, careful non-baked wording

- **Status:** Accepted
- **Date:** 2026-11-01
- **Evidence:** maintainer decision during the project questionnaire, 2026-11-01
- **Supersedes:** none

## Context

A browser context menu can't show rich content. Page CSS must not affect the extension's UI, and the extension must not wrongly call a real badge fake: CDNs often strip baked data. An expired badge isn't forged, so it gets its own state.

## Decision

The right-click item *Inspect Open Badge* opens a card anchored to the image, rendered in a closed Shadow DOM root. The card shows badge name, description, issuer name/URL, issue date, expiry, spec version, recipient type, and a pass/fail/not-run list of checks with reasons. After a scan, every scanned image gets a corner icon: green = verified, yellow = baked but not verified, orange = expired (otherwise valid or unverified; the card shows "Expired on <date>"), red = invalid/revoked/tampered, grey = not baked. An image with no baked data gets exactly the text: "Not an Open Badge: this image contains no Open Badges data. (Badges re-uploaded or resized by some sites lose this data.)"

## Consequences

Icons and card are positioned over the page without changing page layout. Colour is never the only signal (each icon has a shape and a label for accessibility). Criteria, evidence and raw-payload views are out of scope for v1.

## Related files

- `src/ui/`
- `src/content/status-icons.ts`
- `_locales/en/messages.json`
