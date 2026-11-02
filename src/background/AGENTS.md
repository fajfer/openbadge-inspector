<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# background: menu, toolbar, permissions, image fetch, inspection

## Purpose

MV3 event page ([ADR-007](../../.ai/adr/ADR-007-mv3-desktop-esr.md)). Everything that needs extension privileges, plus the
inspection pipeline itself.

## Files

- `index.ts`: top-level listeners (menu, toolbar, messages, storage, permissions). Messages from content scripts:
  `inspect`, `report`, `card-shown`, `open-options`. From extension pages only: `scan-tab`, `inspect-in-tab`,
  `get-tab-report` (used by the E2E suite).
- `inspection.ts`: runs the registry; in-memory cache of offline URL results (300 entries). Online runs are never
  cached and report `blockedOrigins` (failed requests to origins without a host permission).
- `fetch-image.ts`: fallback for images the content script couldn't read (`force-cache`, 10 MiB cap); tells
  `needs-permission` from `fetch-failed`. Background fetches don't get the tab's temporary access, so this needs a
  host permission.
- `permissions.ts`: on a menu click, asks synchronously for the image's origin when it differs from the tab's.
- `tabs.ts`: injects `content.js`, sends requests, keeps per-tab reports, sets the toolbar badge count.
- `auto-scan.ts`: registers or unregisters the auto-scan content script from settings and permissions.

## Contracts

- No state that must survive the event page being unloaded; caches are only optimisations.
- `permissions.request` must be called synchronously in the user-action handler.

## Validate

`npm run test:e2e`.
