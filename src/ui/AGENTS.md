<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ui: info card

> Status: planned. Nothing here is implemented yet; the [v1 spec](../../.ai/specs/2026-11-01-v1-mvp.md) builds it. Update this file when the code differs.

## Purpose

The card shown next to an image after *Inspect Open Badge* or a click on a status icon
([ADR-006](../../.ai/adr/ADR-006-overlay-card-and-status-icons.md)).

## Files

- `card.ts`: builds the card DOM from an `InspectionResult` with `document.createElement` + `textContent`.
- `card.css`: styles, imported as a string and adopted into the shadow root; respects `prefers-color-scheme`.
- `position.ts`: anchors to the image, flips when it would leave the viewport, closes on Escape, outside click or
  scroll away.
- `status.ts`: `BadgeStatus` → icon shape, colour token and message key.

## Contracts

- Fields: name, description, issuer (name + `https:` link), issued, expires, spec version, recipient type/hashed,
  checks list (pass / fail / not run, each with its reason).
- Not baked → only the message `notBaked` (text fixed by ADR-006).
- Expired → orange, with "Expired on <date>" above the checks list.
- *Verify online* button: shown only when `onlineVerification` is on and at least one online verifier applies.
- Accessible: `role="dialog"`, labelled by the badge name, focus moved in and restored on close; icons have
  `aria-label`s.

## Validate

`npx vitest run src/ui` and `npm run test:e2e`.
