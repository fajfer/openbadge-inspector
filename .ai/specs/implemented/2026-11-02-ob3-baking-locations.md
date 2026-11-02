<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->

# OB 3.0 baking locations

- **Status:** implemented
- **Date:** 2026-11-02
- **Issue:** none

## Goal

OB 3.0 badges baked as the spec says are recognised: the Credly and Microsoft PNGs on blog.fajfer.org/en/about/
no longer show as "Not an Open Badge".

## Non-goals

- Images on that page that hold no Open Badges data (two Azure PNGs, the GitHub SVG).
- Online verification of Credly's `did:web` keys.

## Scope

`src/extractors`, fixtures and tests.

## Load

- [root AGENTS.md](../../../AGENTS.md), [extractors](../../../src/extractors/AGENTS.md), [tests](../../../tests/AGENTS.md),
  [ADR-017](../../adr/ADR-017-baked-only-with-lenient-png-chunks.md), [ADR-010](../../adr/ADR-010-untrusted-input.md)

## ADRs affected

ADR-017 superseded by ADR-019.

## Tasks

| # | Task | Load | Done when | Status | Commit |
|---|---|---|---|---|---|
| 1 | ADR-019 supersedes ADR-017 | ADR-017 | ADR-019 Accepted, ADR-017 marked superseded, index and router updated | done | see PR |
| 2 | PNG: `iTXt` "openbadgecredential" is standard; lenient chunks accept it | extractors | unit tests for standard and non-standard `openbadgecredential` chunks pass | done | see PR |
| 3 | SVG: read the OB 3.0 namespace with any prefix | extractors | unit test with `xmlns:ob="https://purl.imsglobal.org/ob/v3p0"` passes | done | see PR |
| 4 | Fixtures bake OB 3.0 the spec's way | tests | `npm run fixtures` regenerated; OB 3.0 fixtures use `openbadgecredential` and the OB 3.0 namespace | done | see PR |

## Validation

`npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `reuse lint`;
`npm run inspect-pages -- https://blog.fajfer.org/en/about/` finds the baked Credly and Microsoft badges.

## Open questions

- None.
