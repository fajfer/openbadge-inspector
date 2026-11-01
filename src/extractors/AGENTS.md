<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# extractors: baked payloads out of PNG and SVG

> Status: planned. Nothing here is implemented yet; the [v1 spec](../../.ai/specs/2026-11-01-v1-mvp.md) builds it. Update this file when the code differs.

## Purpose

Turn an image into zero or more `RawPayload`s. No interpretation of the payload: that's [formats](../formats/AGENTS.md).
Scope is fixed by [ADR-003](../../.ai/adr/ADR-003-baked-only-detection.md); input is hostile
([ADR-010](../../.ai/adr/ADR-010-untrusted-input.md)).

## Files

- `png-itxt.ts`: walks PNG chunks; returns `iTXt` chunks with keyword `openbadges`. Handles the compression flag
  (zlib via `DecompressionStream('deflate')`). Ignores `tEXt` (OB 1.x).
- `svg.ts`: given an SVG `Document`, finds `assertion` and `credential` elements in the `http://openbadges.org`
  namespace; reads the `verify` attribute and the text/CDATA content.
- `classify.ts`: decides `encoding` of a payload string (`https://` URL, JSON object, compact JWS/JWT).
- `limits.ts`: size and depth caps.

## Contracts

- Check the PNG signature, chunk length bounds and CRC32 of every chunk read; stop at `IEND`. A bad CRC → `error`
  with reason `png-corrupt`.
- SVG input arrives as text and is parsed with `DOMParser` as `image/svg+xml`; a `parsererror` → `error`.
- Never decode an image's pixels; only metadata is read.

## Gotchas

- `iTXt` layout: keyword, NUL, compression flag, compression method, language tag, NUL, translated keyword, NUL,
  text (UTF-8).
- One image may contain more than one `openbadges` chunk; return all of them, and the pipeline reports the
  conflict.

## Validate

`npx vitest run src/extractors`
