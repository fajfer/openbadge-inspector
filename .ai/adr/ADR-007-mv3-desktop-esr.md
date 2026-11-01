<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ADR-007: Manifest V3, Firefox desktop ESR 128+

- **Status:** Accepted
- **Date:** 2026-11-01
- **Evidence:** [PROMPT.md](../../PROMPT.md)
- **Supersedes:** none

## Context

PROMPT.md Q4.2, Q5.2. Firefox supports MV3 with event-page background scripts (not service workers). Android has no right-click menu.

## Decision

Manifest V3 with `background.scripts` (event page). Permissions: `activeTab`, `menus`, `scripting`, `storage`. `optional_host_permissions: ["<all_urls>"]`, requested at runtime when auto-scan or online verification is enabled, or when an image is cross-origin and `activeTab` doesn't cover it. `browser_specific_settings.gecko.id` = `openbadge-inspector@fajfer.org`, `strict_min_version` = `128.0`. Desktop only.

## Consequences

The background script can't hold state in globals across restarts; it uses `storage.session`. Cross-origin image bytes are fetched by the background script with the granted host permission. Raising `strict_min_version` or adding permissions needs the maintainer's approval.

## Related files

- `manifest.json`
- `src/background/`
