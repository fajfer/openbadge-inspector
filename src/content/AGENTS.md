<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# content: find images, mark them, talk to the background

## Purpose

Content script injected on demand, or registered on every page in auto mode
([ADR-004](../../.ai/adr/ADR-004-on-demand-scanning.md)). It finds candidate images, asks the background to inspect them,
and drives the [ui](../ui/AGENTS.md) overlay.

## Files

- `index.ts`: guards against double injection, wires the controller, handles `scan-page` and `inspect-image`,
  starts auto-scan.
- `controller.ts`: per-element results, concurrency 4, markers, card, *Verify online*, reports to the background.
- `discover.ts`: `<img>` (`currentSrc`), top-level inline `<svg>`, SVG `<object>`/`<embed>`; skips anything under
  16×16. Inline SVG is serialised; `blob:` URLs are read here; other URLs are fetched by the background.
- `observe.ts`: MutationObserver (debounced) for images added later, auto mode only.

## Contracts

- Messages are defined and Zod-validated in `src/messaging/messages.ts`.
- The page's DOM is only read. All extension UI lives in one closed shadow root.
- `inspect-image` uses `browser.menus.getTargetElement`, then falls back to matching `srcUrl`.

## Validate

`npx vitest run --project dom src/content` and `npm run test:e2e`.
