// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, it } from "vitest";
import { itxtChunk, medalPng, textChunk, ztxtChunk } from "../../tests/fixtures/images.ts";
import { fixtureInput } from "../../tests/fixtures/load.ts";
import { MAX_IMAGE_BYTES, MAX_PAYLOAD_BYTES } from "./limits.ts";
import { pngExtractor } from "./png.ts";

const PALETTE = { ring: [0, 0, 0], fill: [255, 255, 255] } as const;

describe("pngExtractor", () => {
  it("only accepts PNG signatures", () => {
    expect(pngExtractor.accepts(fixtureInput("png/plain.png"))).toBe(true);
    expect(pngExtractor.accepts(fixtureInput("svg/plain.svg"))).toBe(false);
  });

  it("reads every openbadges chunk and ignores other keywords", async () => {
    const bytes = medalPng(PALETTE, [
      itxtChunk("Comment", "hello"),
      itxtChunk("openbadges", "https://issuer.example/a.json"),
      itxtChunk("openbadges", "{}"),
    ]);
    const result = await pngExtractor.extract({ bytes });
    expect(result).toEqual({
      kind: "baked",
      payloads: [
        { container: "png-itxt", encoding: "url", text: "https://issuer.example/a.json" },
        { container: "png-itxt", encoding: "json", text: "{}" },
      ],
    });
  });

  it.each([
    ["zTXt", "openbadge", ztxtChunk("openbadge", "{}")],
    ["tEXt", "openbadges", textChunk("openbadges", "{}")],
    ["iTXt", "openbadge", itxtChunk("openbadge", "{}")],
  ])("reads a non-standard %s %s chunk and says so", async (type, keyword, chunk) => {
    const result = await pngExtractor.extract({ bytes: medalPng(PALETTE, [chunk]) });
    expect(result).toEqual({
      kind: "baked",
      payloads: [{ container: "png-text", encoding: "json", text: "{}", nonStandard: `${type} "${keyword}"` }],
    });
  });

  it("ignores non-standard chunks that hold only a URL", async () => {
    const bytes = medalPng(PALETTE, [ztxtChunk("openbadge", "https://issuer.example/a.json")]);
    expect(await pngExtractor.extract({ bytes })).toEqual({ kind: "not-baked" });
  });

  it("ignores OB 1.0 tEXt chunks", async () => {
    expect(await pngExtractor.extract(fixtureInput("png/ob1-text.png"))).toEqual({ kind: "not-baked" });
  });

  it("reports a CRC mismatch as corrupt", async () => {
    expect(await pngExtractor.extract(fixtureInput("png/corrupt-crc.png"))).toEqual({
      kind: "error",
      reason: "image-corrupt",
    });
  });

  it("reports a truncated file as corrupt", async () => {
    const { bytes } = fixtureInput("png/ob3-rdfc.png");
    const result = await pngExtractor.extract({ bytes: bytes.slice(0, 200) });
    expect(result).toEqual({ kind: "error", reason: "image-corrupt" });
  });

  it("refuses images over the size limit", async () => {
    const bytes = new Uint8Array(MAX_IMAGE_BYTES + 1);
    bytes.set(fixtureInput("png/plain.png").bytes.subarray(0, 8));
    expect(await pngExtractor.extract({ bytes })).toEqual({ kind: "error", reason: "image-too-large" });
  });

  it.each([false, true])("refuses payloads over the limit (compressed: %s)", async (compressed) => {
    const bytes = medalPng(PALETTE, [itxtChunk("openbadges", "x".repeat(MAX_PAYLOAD_BYTES + 1), compressed)]);
    expect(await pngExtractor.extract({ bytes })).toEqual({ kind: "error", reason: "payload-too-large" });
  });
});
