<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ADR-004: On-demand scanning by default

- **Status:** Accepted
- **Date:** 2026-11-01
- **Evidence:** [PROMPT.md](../../PROMPT.md)
- **Supersedes:** none

## Context

PROMPT.md Q1.4. Scanning every page costs bandwidth and CPU and needs broad host access up front. Most pages have no badges.

## Decision

Nothing is scanned until the user clicks the toolbar button (scan the whole page) or uses the right-click item on an image (inspect that image). An `autoScan` setting (off by default) scans every page on load and on DOM changes; turning it on asks for `<all_urls>` host permission at that moment.

## Consequences

The default install needs only `activeTab`, `menus`, `scripting` and `storage`. Auto mode needs the optional host permission and a MutationObserver path, both covered by tests. Whether auto mode becomes per site is an open question in the v1 spec.

## Related files

- `src/background/`
- `src/content/`
- `src/settings/`
