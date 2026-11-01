// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { base58Decode, base58Encode } from "./base58.ts";
import { base64UrlDecode } from "./bytes.ts";

const BASE58_BTC_PREFIX = "z";
const BASE64_URL_PREFIX = "u";

export function multibaseDecode(text: string): Uint8Array<ArrayBuffer> | undefined {
  const body = text.slice(1);
  if (text.startsWith(BASE58_BTC_PREFIX)) {
    return base58Decode(body);
  }
  if (text.startsWith(BASE64_URL_PREFIX)) {
    return base64UrlDecode(body);
  }
  return undefined;
}

export function multibaseEncodeBase58(bytes: Uint8Array): string {
  return BASE58_BTC_PREFIX + base58Encode(bytes);
}
