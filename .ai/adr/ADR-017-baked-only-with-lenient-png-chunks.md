<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->

# ADR-017: Baked badges only, with lenient PNG text chunks

- **Status:** Accepted
- **Date:** 2026-11-02
- **Evidence:** maintainer decisions of 2026-11-02 after testing odznaka.reszka.org (BadgeFed), Credly and imgur
- **Supersedes:** ADR-003

## Context

ADR-003 read only the spec's PNG `iTXt` chunk named `openbadges`. BadgeFed (odznaka.reszka.org) bakes a valid OB 2.0
assertion into a compressed `zTXt` chunk named `openbadge`, so a real badge showed as "Not an Open Badge". Platforms
such as Credly show unbaked images on their pages and keep the data behind links or APIs.

## Decision

- PNG: read `iTXt`, `zTXt` and `tEXt` chunks named `openbadges` or `openbadge`. The spec's `iTXt` "openbadges" is
  standard. Any other combination is read only when it holds JSON or a compact JWS (so OB 1.x URL-only chunks stay
  ignored), and adds a `baking` check with status `warn`. A warning never changes the badge status.
- SVG: `<openbadges:assertion>` (OB 2.0) and `<openbadges:credential>` (OB 3.0) in the `http://openbadges.org`
  namespace, as before.
- Formats: OB 2.0 (hosted URL, assertion JSON, JWS) and OB 3.0 (JSON-LD credential, VC-JWT). JPEG/WebP/GIF are not
  baked.
- Sources: `<img>`/`<picture>` (`currentSrc`), inline `<svg>`, SVG `<object>`/`<embed>`. An `http:` image on an
  `https:` page is read over `https:`, as Firefox displays it.
- Badge pages whose images aren't baked (Credly, Badgr and similar), CSS backgrounds and iframes are permanently out
  of scope (maintainer, 2026-11-02).

## Consequences

Real-world badges baked by non-conforming tools are recognised and still verified, and the card tells the user the
data is stored in a non-standard place. A badge on Credly's own page shows as "Not an Open Badge"; the card's wording
already explains that sites can strip or omit the data.

## Related files

- `src/extractors/png.ts`, `src/extractors/limits.ts`, `src/registry/inspect.ts`, `src/content/discover.ts`
