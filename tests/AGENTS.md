<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# tests: fixtures, unit and E2E

> Status: planned. The [v1 spec](../.ai/specs/2026-11-01-v1-mvp.md) builds it.

## Purpose

Fixtures and test tooling ([ADR-011](../.ai/adr/ADR-011-vitest-and-selenium.md)). Unit tests sit next to the code
as `*.test.ts`; this folder holds what is shared, plus the E2E suite.

## Files

- `fixtures/keys/`: test-only Ed25519 / P-256 keys and `did:key`s. Never used outside tests.
- `fixtures/build-fixtures.ts`: regenerates every baked fixture from JSON sources and keys (`npm run fixtures`).
- `fixtures/png/`, `fixtures/svg/`: `ob2-hosted`, `ob2-embedded`, `ob2-signed`, `ob3-jsonld-didkey`,
  `ob3-vcjwt-didkey`, `ob3-expired`, `ob3-tampered`, `plain` (not baked), `stripped` (re-encoded copy),
  `corrupt-crc`, `oversized`, `malformed-json`, `ob1-text` (must read as not baked).
- `fixtures/pages/`: HTML pages for E2E (img, picture/srcset, lazy, inline svg, object/embed, cross-origin).
- `e2e/`: `selenium-webdriver` + geckodriver; `setup.ts` builds, installs the temporary add-on and serves pages
  on two local origins.

## Contracts

- Every fixture image has a matching `.license` sidecar or `REUSE.toml` entry.
- Tests pass a fixed `now`; never compare with the real clock.
- No test makes a real network request: online verifiers get a fake `fetchJson`; E2E serves issuer documents
  from the local server.
- Native context menus can't be clicked from Selenium; E2E sends the same `inspect-image` message the menu item sends.

## Validate

`npm test`, `npm run test:e2e`
