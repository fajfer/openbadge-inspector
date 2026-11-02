<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->

# ADR-019: Read OB 3.0 baking locations from the spec

- **Status:** Accepted
- **Date:** 2026-11-02
- **Evidence:** Credly and Microsoft OB 3.0 PNGs on blog.fajfer.org/en/about/ showed as "Not an Open Badge";
  Open Badges 3.0 §5.3.1.1 (PNG) and §5.3.2.1 (SVG), https://www.imsglobal.org/spec/ob/v3p0/
- **Supersedes:** ADR-017

## Context

ADR-017 read PNG text chunks named `openbadges` or `openbadge` and SVG elements in the `http://openbadges.org`
namespace. Those are the OB 2.0 locations. OB 3.0 bakes a PNG into an `iTXt` chunk named `openbadgecredential`, and
an SVG into `<openbadges:credential>` with `xmlns:openbadges="https://purl.imsglobal.org/ob/v3p0"`. Every OB 3.0 PNG
issued by Credly and Microsoft therefore showed as "Not an Open Badge". The test fixtures baked OB 3.0 under the OB
2.0 keyword, so the suite never noticed.

## Decision

- PNG: read `iTXt`, `zTXt` and `tEXt` chunks named `openbadgecredential`, `openbadges` or `openbadge`. An `iTXt`
  chunk named `openbadgecredential` or `openbadges` is standard, whichever OB version it holds. Any other
  combination is read only when it holds JSON or a compact JWS, and adds a `baking` check with status `warn`, as in
  ADR-017.
- SVG: `<assertion>` and `<credential>` elements in the `http://openbadges.org` (OB 2.0) or
  `https://purl.imsglobal.org/ob/v3p0` (OB 3.0) namespace, with any prefix. The `openbadges:` tag-name fallback for
  inline SVG serialised from HTML stays.
- Fixtures bake OB 3.0 the way the spec says: `iTXt` "openbadgecredential" and the OB 3.0 SVG namespace.
- Everything else in ADR-017 (formats, sources, out-of-scope pages) stays as decided there.

## Consequences

Spec-conforming OB 3.0 badges from Credly, Microsoft and other issuers are recognised. A mismatch between keyword and
OB version (OB 3.0 under `openbadges`) is not flagged, as it doesn't hide the data from any reader that follows
either version of the spec.

## Related files

- `src/extractors/png.ts`, `src/extractors/svg.ts`, `src/extractors/limits.ts`, `tests/fixtures/build-fixtures.ts`
