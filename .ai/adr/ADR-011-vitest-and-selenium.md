<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ADR-011: Vitest for unit tests, Selenium and geckodriver for E2E

- **Status:** Accepted
- **Date:** 2026-11-01
- **Evidence:** [PROMPT.md](../../PROMPT.md)
- **Supersedes:** none

## Context

PROMPT.md Q4.3. The openmercato guidance asks for E2E tests in Playwright, but Playwright can't load extensions in Firefox.

## Decision

Unit and integration tests use Vitest with fixture files in `tests/fixtures/`. E2E tests use `selenium-webdriver` with geckodriver and headless Firefox. The built extension is installed as a temporary add-on, and tests run against static fixture pages served locally. E2E tests run in CI.

## Consequences

Fixtures for signed badges need test keys, generated once by a script and committed (test keys only). E2E tests can't click native context menus, so they trigger the same message the menu item sends.

## Related files

- `tests/`
- `vitest.config.ts`
