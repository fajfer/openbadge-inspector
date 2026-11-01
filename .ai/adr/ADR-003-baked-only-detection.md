<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ADR-003: Detect only baked Open Badges 2.0 and 3.0 in PNG and SVG

- **Status:** Accepted
- **Date:** 2026-11-01
- **Evidence:** maintainer decision during the project questionnaire, 2026-11-01
- **Supersedes:** none

## Context

The baking spec defines PNG `iTXt` chunks and SVG elements with the keyword/namespace `openbadges`. OB 1.x is rare and out of scope. Many sites show plain images that link to badge platforms, but detecting those relies on heuristics, not metadata, so the maintainer chose baked-only for v1.

## Decision

The extension reads only: PNG `iTXt` chunks with keyword `openbadges`, SVG `<openbadges:assertion>` (OB 2.0) and `<openbadges:credential>` (OB 3.0) in the `http://openbadges.org` namespace. Payloads are understood as OB 2.0 (hosted URL, assertion JSON, JWS) or OB 3.0 (JSON-LD `OpenBadgeCredential`, VC-JWT). OB 1.x `tEXt` chunks, JPEG/WebP/GIF, link-only badges, CSS background images and iframes are reported as not baked or ignored. v1 image sources: `<img>` (including the `currentSrc` chosen from `srcset`/`<picture>`), inline `<svg>`, and SVG in `<object>`/`<embed>`.

## Consequences

The detector is simple and its claims are well-founded. Badges stripped of metadata by a CDN show as not baked; the wording in ADR-006 covers that. Adding sources or formats later goes through the registry (ADR-009) and needs a new ADR.

## Related files

- `src/extractors/`
- `src/content/discover.ts`
