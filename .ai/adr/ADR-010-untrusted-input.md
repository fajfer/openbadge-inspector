<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ADR-010: Baked payloads and page images are untrusted input

- **Status:** Accepted
- **Date:** 2026-11-01
- **Evidence:** [PROMPT.md](../../PROMPT.md)
- **Supersedes:** none

## Context

Analysis in PROMPT.md §2.3. Anyone can bake any data into an image; the extension runs on every page.

## Decision

Payloads are capped (image bytes 10 MiB, payload 1 MiB, JSON depth 64) before parsing. PNG parsing checks chunk lengths and CRCs and stops at `IEND`. SVG is parsed with `DOMParser` as `image/svg+xml` and only queried, never inserted into a document. All strings shown on the card go through `textContent`. URLs from payloads are shown as text plus a link only when the scheme is `https:`, and they are never fetched without ADR-005's click. Messages between extension contexts are Zod-validated.

## Consequences

Fuzz-like tests with malformed PNG/SVG fixtures are required. Some valid but oversized badges will be reported as too large.

## Related files

- `src/extractors/`
- `src/ui/`
