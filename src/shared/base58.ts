// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE = 58n;

export function base58Decode(text: string): Uint8Array<ArrayBuffer> | undefined {
  let value = 0n;
  for (const character of text) {
    const digit = ALPHABET.indexOf(character);
    if (digit < 0) {
      return undefined;
    }
    value = value * BASE + BigInt(digit);
  }
  const body: number[] = [];
  while (value > 0n) {
    body.unshift(Number(value & 0xffn));
    value >>= 8n;
  }
  const leadingZeros = text.length - text.replace(/^1+/, "").length;
  return Uint8Array.from([...new Array<number>(leadingZeros).fill(0), ...body]);
}

export function base58Encode(bytes: Uint8Array): string {
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) + BigInt(byte);
  }
  let text = "";
  while (value > 0n) {
    text = (ALPHABET[Number(value % BASE)] ?? "") + text;
    value /= BASE;
  }
  const leadingZeros = bytes.findIndex((byte) => byte !== 0);
  const zeroCount = leadingZeros < 0 ? bytes.length : leadingZeros;
  return "1".repeat(zeroCount) + text;
}
