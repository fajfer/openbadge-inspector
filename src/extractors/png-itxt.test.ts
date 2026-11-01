// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, it } from "vitest";
import { itxtChunk, medalPng } from "../../tests/fixtures/images.ts";
import { fixtureInput } from "../../tests/fixtures/load.ts";
import { MAX_IMAGE_BYTES, MAX_PAYLOAD_BYTES } from "./limits.ts";
import { pngItxtExtractor } from "./png-itxt.ts";

const PALETTE = { ring: [0, 0, 0], fill: [255, 255, 255] } as const;

describe("pngItxtExtractor", () => {
  it("only accepts PNG signatures", () => {
    expect(pngItxtExtractor.accepts(fixtureInput("png/plain.png"))).toBe(true);
    expect(pngItxtExtractor.accepts(fixtureInput("svg/plain.svg"))).toBe(false);
  });

  it("reads every openbadges chunk and ignores other keywords", async () => {
    const bytes = medalPng(PALETTE, [
      itxtChunk("Comment", "hello"),
      itxtChunk("openbadges", "https://issuer.example/a.json"),
      itxtChunk("openbadges", "{}"),
    ]);
    const result = await pngItxtExtractor.extract({ bytes });
    expect(result).toEqual({
      kind: "baked",
      payloads: [
        { container: "png-itxt", encoding: "url", text: "https://issuer.example/a.json" },
        { container: "png-itxt", encoding: "json", text: "{}" },
      ],
    });
  });

  it("ignores OB 1.0 tEXt chunks", async () => {
    expect(await pngItxtExtractor.extract(fixtureInput("png/ob1-text.png"))).toEqual({ kind: "not-baked" });
  });

  it("reports a CRC mismatch as corrupt", async () => {
    expect(await pngItxtExtractor.extract(fixtureInput("png/corrupt-crc.png"))).toEqual({
      kind: "error",
      reason: "image-corrupt",
    });
  });

  it("reports a truncated file as corrupt", async () => {
    const { bytes } = fixtureInput("png/ob3-rdfc.png");
    const result = await pngItxtExtractor.extract({ bytes: bytes.slice(0, 200) });
    expect(result).toEqual({ kind: "error", reason: "image-corrupt" });
  });

  it("refuses images over the size limit", async () => {
    const bytes = new Uint8Array(MAX_IMAGE_BYTES + 1);
    bytes.set(fixtureInput("png/plain.png").bytes.subarray(0, 8));
    expect(await pngItxtExtractor.extract({ bytes })).toEqual({ kind: "error", reason: "image-too-large" });
  });

  it.each([false, true])("refuses payloads over the limit (compressed: %s)", async (compressed) => {
    const bytes = medalPng(PALETTE, [itxtChunk("openbadges", "x".repeat(MAX_PAYLOAD_BYTES + 1), compressed)]);
    expect(await pngItxtExtractor.extract({ bytes })).toEqual({ kind: "error", reason: "payload-too-large" });
  });
});
