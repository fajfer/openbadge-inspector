<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# content: find images, mark them, talk to the background

> Status: planned. Nothing here is implemented yet; the [v1 spec](../../.ai/specs/2026-11-01-v1-mvp.md) builds it. Update this file when the code differs.

## Purpose

Content script injected on demand (or on every page in auto mode,
[ADR-004](../../.ai/adr/ADR-004-on-demand-scanning.md)). It finds candidate images, gets their bytes or SVG
document, runs `inspect`, and draws status icons.

## Files

- `discover.ts`: candidates = `<img>` (`currentSrc`), inline `<svg>`, `<object>`/`<embed>` with SVG `data`/`src`
  ([ADR-003](../../.ai/adr/ADR-003-baked-only-detection.md)). Skips images smaller than 16×16 px.
- `bytes.ts`: same-origin and `data:`/`blob:` sources are read in page; cross-origin URLs are fetched through a
  `fetch-image` message to the background script.
- `scan.ts`: scans all candidates with a concurrency limit of 4; dedupes by URL.
- `observe.ts`: MutationObserver + `load` listeners for lazy images, auto mode only.
- `status-icons.ts`: one positioned host element per image, inside a shared Shadow DOM overlay layer.
- `messages.ts`: Zod schemas for every message in and out.

## Contracts

- Messages: `scan-page`, `inspect-image { srcUrl }`, `fetch-image { url }` → `{ mime, bytes }`,
  `verify-online { imageId }`. All validated on receipt.
- The page's DOM is only read; extension UI lives in its own Shadow DOM root attached to an element appended to
  `document.documentElement`.
- Inline SVG is cloned and serialised with `XMLSerializer`, then re-parsed by the extractor, never touched in place.

## Validate

`npx vitest run src/content` (jsdom) and `npm run test:e2e`.
