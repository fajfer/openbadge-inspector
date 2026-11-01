<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# settings: options page and stored settings

## Purpose

The options page and the typed settings store.

## Files

- `settings.schema.ts`: `autoScan` (false), `onlineVerification` (false), `showNotBakedMarkers` (true); invalid
  values fall back per key.
- `store.ts`: `getSettings`, `updateSettings` over `storage.sync`; `hasAllUrls`.
- `options.ts`, `options.css`, `options.html`: the page. Turning on `autoScan` or `onlineVerification` requests
  `<all_urls>`; if Firefox refuses, the box unticks with an explanation.

## Contracts

- `autoScan` is one global switch, not per site.
- Adding a setting: schema + default + `OPTIONS` entry + message keys + test.

## Validate

`npx vitest run src/settings`
