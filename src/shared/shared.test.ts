// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, it } from "vitest";
import { classifyPayload } from "../extractors/classify.ts";
import { base58Decode, base58Encode } from "./base58.ts";
import { base64UrlDecode, base64UrlEncode } from "./bytes.ts";
import { canonicalizeJson } from "./jcs.ts";
import { MAX_JSON_DEPTH, parseJson } from "./json.ts";
import { decodeCompactJws } from "./jws.ts";

describe("encoders", () => {
  it.each([[[]], [[0]], [[0, 0, 1, 2, 255]], [[255, 254, 253]]])("round-trips base58 %j", (values) => {
    const bytes = Uint8Array.from(values);
    expect(base58Decode(base58Encode(bytes))).toEqual(bytes);
  });

  it("rejects invalid base58 and base64url", () => {
    expect(base58Decode("0OIl")).toBeUndefined();
    expect(base64UrlDecode("a+b/")).toBeUndefined();
  });

  it("round-trips base64url", () => {
    const bytes = Uint8Array.from([251, 255, 0, 1]);
    expect(base64UrlDecode(base64UrlEncode(bytes))).toEqual(bytes);
  });
});

describe("canonicalizeJson", () => {
  it("sorts keys and keeps arrays in order", () => {
    expect(canonicalizeJson({ b: [2, 1], a: { d: null, c: "é" } })).toBe('{"a":{"c":"é","d":null},"b":[2,1]}');
  });
});

describe("parseJson", () => {
  it("rejects documents nested deeper than the limit", () => {
    const deep = "[".repeat(MAX_JSON_DEPTH + 1) + "]".repeat(MAX_JSON_DEPTH + 1);
    expect(parseJson(deep)).toBeUndefined();
    expect(parseJson("[[1]]")).toEqual([[1]]);
  });

  it("returns undefined for invalid JSON", () => {
    expect(parseJson("{")).toBeUndefined();
  });
});

describe("classifyPayload", () => {
  it.each([
    ['  {"a":1}', "json"],
    ["https://issuer.example/a.json", "url"],
    ["eyJhbGciOiJSUzI1NiJ9.eyJhIjoxfQ.c2ln", "compact-jws"],
    ["javascript:alert(1)", "unknown"],
  ])("%s is %s", (text, expected) => {
    expect(classifyPayload(text)).toBe(expected);
  });
});

describe("decodeCompactJws", () => {
  it("decodes header and payload", () => {
    expect(decodeCompactJws("eyJhbGciOiJSUzI1NiJ9.eyJhIjoxfQ.c2ln")).toMatchObject({
      header: { alg: "RS256" },
      payload: { a: 1 },
      signature: "c2ln",
    });
  });

  it("rejects non-JSON parts", () => {
    expect(decodeCompactJws("bm9wZQ.bm9wZQ.c2ln")).toBeUndefined();
  });
});
