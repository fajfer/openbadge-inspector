<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->

# Real-world badges: reszka.org, Credly, imgur

- **Status:** implemented
- **Date:** 2026-11-02
- **Issue:** none

## Goal

Badges the maintainer tested on live sites show the right result: the BadgeFed badge on odznaka.reszka.org is
recognised and verifiable, and images the extension can't read don't clutter page scans.

## Non-goals

- Recognising unbaked badge pages (Credly, Badgr): out of scope for good (ADR-017).
- Changing BadgeFed.

## Scope

`src/extractors`, `src/registry`, `src/content`, `src/ui`, fixtures and tests.

## Load

- [root AGENTS.md](../../../AGENTS.md), [extractors](../../../src/extractors/AGENTS.md),
  [content](../../../src/content/AGENTS.md), [ADR-017](../../adr/ADR-017-baked-only-with-lenient-png-chunks.md)

## ADRs affected

ADR-003 superseded by ADR-017.

## Tasks

| # | Task | Load | Done when | Status | Commit |
|---|---|---|---|---|---|
| 1 | Read `http:` images on `https:` pages over `https:` | content | reszka.org badge is read in Firefox | done | see PR |
| 2 | Read non-standard PNG text chunks with a `baking` warning | extractors, ADR-017 | `zTXt` "openbadge" and `tEXt` "openbadges" fixtures pass; OB 1.x stays not baked | done | see PR |
| 3 | No markers for unreadable images on page scans | content | imgur UI icons get no "?" | done | see PR |
| 4 | Tool to run the extension on live pages | tests | `npm run inspect-pages -- <url>` prints results | done | see PR |

## Validation

`npm test`, `npm run test:e2e`; `npm run inspect-pages -- https://odznaka.reszka.org/view/grant/odznakareszkaorg_8_1_81bd973ba9611087987c50769193a675`
shows the badge as `unverified`, and online verification against the live issuer returns `verified` with the
storage warning.

## Open questions

- None.
