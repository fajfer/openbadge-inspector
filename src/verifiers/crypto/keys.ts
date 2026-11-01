// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { base64Decode, startsWithBytes } from "../../shared/bytes.ts";
import type { JsonObject } from "../../shared/json.ts";
import { multibaseDecode } from "../../shared/multibase.ts";

export type VerificationKey =
  | { readonly kind: "ed25519"; readonly raw: Uint8Array<ArrayBuffer> }
  | { readonly kind: "jwk"; readonly jwk: JsonWebKey }
  | { readonly kind: "spki"; readonly der: Uint8Array<ArrayBuffer> };

const ED25519_MULTICODEC = [0xed, 0x01] as const;
const ED25519_KEY_LENGTH = 32;

export function ed25519FromMultikey(publicKeyMultibase: string): VerificationKey | undefined {
  const bytes = multibaseDecode(publicKeyMultibase);
  if (bytes === undefined || !startsWithBytes(bytes, ED25519_MULTICODEC)) {
    return undefined;
  }
  const raw = bytes.slice(ED25519_MULTICODEC.length);
  return raw.length === ED25519_KEY_LENGTH ? { kind: "ed25519", raw } : undefined;
}

export function keyFromDidKey(verificationMethod: string): VerificationKey | undefined {
  const match = /^did:key:(z[1-9A-HJ-NP-Za-km-z]+)(#.*)?$/.exec(verificationMethod);
  const multikey = match?.[1];
  return multikey === undefined ? undefined : ed25519FromMultikey(multikey);
}

export function keyFromJwk(jwk: JsonObject): VerificationKey | undefined {
  const kty = jwk.kty;
  if (kty !== "OKP" && kty !== "EC" && kty !== "RSA") {
    return undefined;
  }
  const publicOnly = Object.fromEntries(
    Object.entries(jwk).filter(([name]) => !["d", "p", "q", "dp", "dq", "qi"].includes(name)),
  );
  return { kind: "jwk", jwk: publicOnly };
}

export function keyFromPem(pem: string): VerificationKey | undefined {
  const match = /-----BEGIN PUBLIC KEY-----([\s\S]+?)-----END PUBLIC KEY-----/.exec(pem);
  const body = match?.[1]?.replace(/\s+/g, "");
  if (body === undefined) {
    return undefined;
  }
  try {
    return { kind: "spki", der: base64Decode(body) };
  } catch {
    return undefined;
  }
}
