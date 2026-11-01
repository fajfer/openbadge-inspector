// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { base64UrlDecode } from "../../shared/bytes.ts";
import type { CompactJws } from "../../shared/jws.ts";
import { signingInputBytes } from "../../shared/jws.ts";
import type { VerificationKey } from "./keys.ts";

export type SignatureOutcome = "valid" | "invalid" | "unsupported";

type JwsAlgorithm = "EdDSA" | "Ed25519" | "ES256" | "RS256";

interface AlgorithmParameters {
  readonly importParams: AlgorithmIdentifier | EcKeyImportParams | RsaHashedImportParams;
  readonly verifyParams: AlgorithmIdentifier | EcdsaParams;
}

const ALGORITHMS: Readonly<Record<JwsAlgorithm, AlgorithmParameters>> = {
  EdDSA: { importParams: { name: "Ed25519" }, verifyParams: { name: "Ed25519" } },
  Ed25519: { importParams: { name: "Ed25519" }, verifyParams: { name: "Ed25519" } },
  ES256: {
    importParams: { name: "ECDSA", namedCurve: "P-256" },
    verifyParams: { name: "ECDSA", hash: "SHA-256" },
  },
  RS256: {
    importParams: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    verifyParams: { name: "RSASSA-PKCS1-v1_5" },
  },
};

export async function verifyEd25519(
  key: VerificationKey,
  signature: Uint8Array<ArrayBuffer>,
  data: Uint8Array<ArrayBuffer>,
): Promise<SignatureOutcome> {
  return verifyWith("Ed25519", key, signature, data);
}

export async function verifyCompactJws(jws: CompactJws, key: VerificationKey): Promise<SignatureOutcome> {
  const algorithm = jws.header.alg;
  const signature = base64UrlDecode(jws.signature);
  if (typeof algorithm !== "string" || !(algorithm in ALGORITHMS) || signature === undefined) {
    return "unsupported";
  }
  return verifyWith(algorithm as JwsAlgorithm, key, signature, signingInputBytes(jws));
}

async function verifyWith(
  algorithm: JwsAlgorithm,
  key: VerificationKey,
  signature: Uint8Array<ArrayBuffer>,
  data: Uint8Array<ArrayBuffer>,
): Promise<SignatureOutcome> {
  const { importParams, verifyParams } = ALGORITHMS[algorithm];
  let cryptoKey: CryptoKey;
  try {
    cryptoKey = await importKey(key, importParams);
  } catch {
    return "unsupported";
  }
  try {
    return (await crypto.subtle.verify(verifyParams, cryptoKey, signature, data)) ? "valid" : "invalid";
  } catch {
    return "invalid";
  }
}

function importKey(
  key: VerificationKey,
  params: AlgorithmIdentifier | EcKeyImportParams | RsaHashedImportParams,
): Promise<CryptoKey> {
  switch (key.kind) {
    case "ed25519":
      return crypto.subtle.importKey("raw", key.raw, params, false, ["verify"]);
    case "jwk":
      return crypto.subtle.importKey("jwk", key.jwk, params, false, ["verify"]);
    case "spki":
      return crypto.subtle.importKey("spki", key.der, params, false, ["verify"]);
  }
}
