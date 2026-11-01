// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { deflateSync } from "node:zlib";
import { crc32 } from "../../src/extractors/crc32.ts";
import { concatBytes, utf8Encode } from "../../src/shared/bytes.ts";

const PNG_SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const SIZE = 128;

export interface Palette {
  readonly ring: readonly [number, number, number];
  readonly fill: readonly [number, number, number];
}

export function pngChunk(type: string, data: Uint8Array): Uint8Array<ArrayBuffer> {
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, data.length);
  const typeAndData = concatBytes(utf8Encode(type), data);
  const crc = new Uint8Array(4);
  new DataView(crc.buffer).setUint32(0, crc32(typeAndData));
  return concatBytes(length, typeAndData, crc);
}

export function itxtChunk(keyword: string, text: string, compressed = false): Uint8Array<ArrayBuffer> {
  const body = compressed ? new Uint8Array(deflateSync(utf8Encode(text))) : utf8Encode(text);
  const header = concatBytes(utf8Encode(keyword), Uint8Array.from([0, compressed ? 1 : 0, 0, 0, 0]));
  return pngChunk("iTXt", concatBytes(header, body));
}

export function textChunk(keyword: string, text: string): Uint8Array<ArrayBuffer> {
  return pngChunk("tEXt", concatBytes(utf8Encode(keyword), Uint8Array.from([0]), utf8Encode(text)));
}

export function medalPng(palette: Palette, extraChunks: readonly Uint8Array[] = []): Uint8Array<ArrayBuffer> {
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, SIZE);
  view.setUint32(4, SIZE);
  header.set([8, 6, 0, 0, 0], 8);
  const rows: number[] = [];
  const centre = (SIZE - 1) / 2;
  for (let y = 0; y < SIZE; y += 1) {
    rows.push(0);
    for (let x = 0; x < SIZE; x += 1) {
      const distance = Math.hypot(x - centre, y - centre);
      const star = isInStar(x - centre, y - centre, 30);
      if (distance > 62) {
        rows.push(0, 0, 0, 0);
      } else if (distance > 52 || star) {
        rows.push(...palette.ring, 255);
      } else {
        rows.push(...palette.fill, 255);
      }
    }
  }
  const pixels = new Uint8Array(deflateSync(Uint8Array.from(rows)));
  return concatBytes(
    PNG_SIGNATURE,
    pngChunk("IHDR", header),
    ...extraChunks,
    pngChunk("IDAT", pixels),
    pngChunk("IEND", new Uint8Array()),
  );
}

function isInStar(x: number, y: number, radius: number): boolean {
  const angle = Math.atan2(y, x) + Math.PI / 2;
  const sector = (2 * Math.PI) / 5;
  const local = Math.abs((((angle % sector) + sector) % sector) - sector / 2);
  const edge = radius * (0.45 + 0.55 * (1 - local / (sector / 2)));
  return Math.hypot(x, y) < edge;
}

export function medalSvg(palette: Palette, label: string, metadata = "", extra = ""): string {
  const [rr, rg, rb] = palette.ring;
  const [fr, fg, fb] = palette.fill;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:openbadges="http://openbadges.org" width="128" height="128" viewBox="0 0 128 128">
  ${metadata}
  <circle cx="64" cy="64" r="62" fill="rgb(${String(rr)},${String(rg)},${String(rb)})"/>
  <circle cx="64" cy="64" r="52" fill="rgb(${String(fr)},${String(fg)},${String(fb)})"/>
  <text x="64" y="72" font-family="sans-serif" font-size="20" text-anchor="middle" fill="white">${label}</text>
  ${extra}
</svg>
`;
}
