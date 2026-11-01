<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# settings: options page and stored settings

> Status: planned. Nothing here is implemented yet; the [v1 spec](../../.ai/specs/2026-11-01-v1-mvp.md) builds it. Update this file when the code differs.

## Purpose

The options page and the typed settings store.

## Files

- `settings.schema.ts`: Zod schema with defaults: `autoScan: false`, `onlineVerification: false`,
  `showNotBakedIcons: true`.
- `store.ts`: `getSettings()` / `updateSettings(patch)` over `storage.sync`, always parsed through the schema.
- `options.html`, `options.ts`: the page. Toggling `autoScan` or `onlineVerification` on requests the host
  permission; if it's refused, the toggle stays off.

## Contracts

- Unknown or invalid stored values fall back to defaults (parse, don't trust storage).
- Adding a setting: schema + default + options control + message keys + test.

## Validate

`npx vitest run src/settings`
