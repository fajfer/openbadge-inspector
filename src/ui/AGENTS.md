<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ui: markers, info card, toast

## Purpose

Everything the user sees on a page ([ADR-006](../../.ai/adr/ADR-006-overlay-card-and-status-icons.md)).

## Files

- `overlay.ts`: one host element with a closed shadow root; markers positioned in document coordinates and
  repositioned on scroll/resize; card open/close (Escape, outside click, focus restore); toast.
- `card.ts`: builds the card from an `InspectionResult` with `createElement` + `textContent` only.
- `status.ts`: status → symbol, tone and message key; check and reason message keys.
- `position.ts`: marker and card placement (right of the image, else left, else centred; clamped to the viewport).
- `dom.ts`: `element()`, `truncate()`, `safeHttpsUrl()`. `overlay.css`: styles, light and dark.

## Contracts

- Not baked → only `notBakedExplanation` (wording fixed by ADR-006). Expired → orange with "Expired on <date>".
- Links only for `https:` URLs, with `rel="noopener noreferrer"`.
- Typography is set on `.layer`/`.toast`, not `:host`: the host's inline `all: initial` beats `:host`.

## Validate

`npx vitest run --project dom src/ui`; check the look with `npm run demo` or the E2E screenshots
(`E2E_SCREENSHOTS=<dir> npm run test:e2e`).
