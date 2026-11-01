<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# tests: fixtures, unit and E2E

## Purpose

Fixtures and test tooling ([ADR-011](../.ai/adr/ADR-011-vitest-and-selenium.md)). Unit tests sit next to the code as
`*.test.ts` (Node) or `*.dom.test.ts` (jsdom); this folder holds what is shared, plus the E2E suite.

## Files

- `fixtures/build-fixtures.ts` (`npm run fixtures`): regenerates every PNG/SVG badge, `online/` documents and
  `pages/gallery.html`. Output is byte-for-byte reproducible; CI checks this.
- `fixtures/catalog.ts`: every fixture with its expected offline status. Unit and E2E tests both use it.
- `fixtures/keys/`: test-only Ed25519 and RSA keys, created on the first run. Never use them elsewhere.
- `fixtures/credentials.ts`, `images.ts`, `gallery.ts`, `load.ts`, `fake-http.ts`: builders and helpers.
- `fixtures/w3c/`: W3C `vc-di-eddsa` test vectors (W3C licence, see `REUSE.toml`).
- `e2e/`: `firefox.ts` (Selenium + geckodriver, extension installed as a temporary add-on, extension pages opened
  through the chrome context), `server.ts` (fixtures on `127.0.0.1:8765` and `localhost:8766`),
  `session.ts` (shared helpers), `extension.e2e.ts`, and `temporary-access.e2e.ts` (fresh profile, no optional
  permissions, the real toolbar action triggered through Firefox's `browserActionFor(...).triggerAction`).

## Contracts

- Pass a fixed `now` (`FIXTURE_NOW`); never compare with the real clock. Gallery badges are valid until 2031.
- No test makes a real network request: online verifiers get `fakeHttp`.
- Selenium can't click native menus; E2E sends `inspect-in-tab` from the options page. The toolbar is triggered for
  real in `temporary-access.e2e.ts`.
- Every user flow must also pass with only the default permissions. Don't grant `<all_urls>` before a scenario that
  a fresh install would run without it.
- 1EdTech samples are not included: their repository states no licence.

## Validate

`npm test`, `npm run test:e2e` (`E2E_HEADED=1` to watch, `E2E_SCREENSHOTS=<dir>` to save screenshots).
