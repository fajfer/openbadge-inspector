<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# background: menus, toolbar, permissions, cross-origin fetch

> Status: planned. Nothing here is implemented yet; the [v1 spec](../../.ai/specs/2026-11-01-v1-mvp.md) builds it. Update this file when the code differs.

## Purpose

MV3 event page ([ADR-007](../../.ai/adr/ADR-007-mv3-desktop-esr.md)). It owns everything that needs extension
privileges: the context menu, the toolbar action, permission prompts, injecting the content script, and fetching
image bytes or (online mode) verification resources.

## Files

- `index.ts`: registers listeners at top level (event pages need this to wake up).
- `menus.ts`: `menus.create` for `contexts: ['image']` → *Inspect Open Badge*; on click injects the content
  script into the tab if needed and sends `inspect-image`.
- `action.ts`: toolbar click → inject + `scan-page`; badge text = number of baked images found.
- `inject.ts`: `scripting.executeScript` with the built content script, idempotent per tab.
- `fetch-image.ts`: fetches bytes for a content script (`credentials: 'omit'`, 10 MiB cap, image MIME types only).
- `permissions.ts`: requests `<all_urls>` from a user gesture only.
- `session-cache.ts`: `storage.session` cache of inspection and online-verification results per URL.

## Contracts

- Event pages can be unloaded at any time: no state in module globals.
- `fetch-image` refuses non-`http(s):` URLs and is answered only for tabs the extension injected.
- `permissions.request` must be called synchronously inside the user-action handler.

## Validate

`npx vitest run src/background` and `npm run test:e2e`.
