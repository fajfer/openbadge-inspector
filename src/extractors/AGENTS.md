<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# extractors: baked payloads out of PNG and SVG

## Purpose

Turn image bytes into zero or more `RawPayload`s without interpreting them; that's [formats](../formats/AGENTS.md).
Scope: [ADR-003](../../.ai/adr/ADR-003-baked-only-detection.md). Input is hostile: [ADR-010](../../.ai/adr/ADR-010-untrusted-input.md).

## Files

- `png-itxt.ts`: walks PNG chunks, checks lengths and CRC32 of every chunk, stops at `IEND`, returns `iTXt` chunks
  with keyword `openbadges` (inflating compressed ones with `DecompressionStream`). `tEXt` (OB 1.x) is ignored.
- `svg.ts`: sniffs SVG, parses it with `DOMParser` as `image/svg+xml`, reads `assertion` and `credential` elements
  in the `http://openbadges.org` namespace (text/CDATA first, then the `verify` attribute). Falls back to the
  `openbadges:` tag name, which is what an inline SVG serialised from an HTML page looks like.
- `classify.ts`: `json`, `url` (http/https only), `compact-jws` or `unknown`.
- `crc32.ts`, `limits.ts`: 10 MiB image cap, 1 MiB payload cap (also after inflating).

## Gotchas

- `iTXt` layout: keyword, NUL, compression flag, compression method, language tag, NUL, translated keyword, NUL, text.
- One image can hold several `openbadges` chunks; the pipeline verifies the first and the card says how many there are.
- Never decode pixels, and never insert a parsed SVG into a document.

## Validate

`npx vitest run --project node src/extractors && npx vitest run --project dom src/extractors`
