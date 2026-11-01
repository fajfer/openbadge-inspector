// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { base64UrlDecode, utf8Decode, utf8Encode } from "./bytes.ts";
import { type JsonObject, parseJsonObject } from "./json.ts";

export interface CompactJws {
  readonly header: JsonObject;
  readonly payload: JsonObject;
  readonly signingInput: string;
  readonly signature: string;
}

export const COMPACT_JWS_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/;

export function decodeCompactJws(text: string): CompactJws | undefined {
  const trimmed = text.trim();
  if (!COMPACT_JWS_PATTERN.test(trimmed)) {
    return undefined;
  }
  const [encodedHeader = "", encodedPayload = "", signature = ""] = trimmed.split(".");
  const header = decodeJsonPart(encodedHeader);
  const payload = decodeJsonPart(encodedPayload);
  if (header === undefined || payload === undefined) {
    return undefined;
  }
  return { header, payload, signingInput: `${encodedHeader}.${encodedPayload}`, signature };
}

export function signingInputBytes(jws: CompactJws): Uint8Array<ArrayBuffer> {
  return utf8Encode(jws.signingInput);
}

function decodeJsonPart(part: string): JsonObject | undefined {
  const bytes = base64UrlDecode(part);
  return bytes === undefined ? undefined : parseJsonObject(utf8Decode(bytes));
}
