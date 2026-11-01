// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { base64UrlDecode, concatBytes } from "../../src/shared/bytes.ts";
import { multibaseEncodeBase58 } from "../../src/shared/multibase.ts";

const KEYS_DIR = resolve(import.meta.dirname, "keys");

export interface TestKeys {
  readonly ed25519Private: CryptoKey;
  readonly ed25519Public: JsonWebKey;
  readonly didKey: string;
  readonly verificationMethod: string;
  readonly rsaPrivate: CryptoKey;
  readonly rsaPublicPem: string;
}

async function loadOrCreate(name: string, generate: () => Promise<CryptoKeyPair>): Promise<JsonWebKey> {
  const path = resolve(KEYS_DIR, `${name}.json`);
  if (existsSync(path)) {
    return JSON.parse(await readFile(path, "utf8")) as JsonWebKey;
  }
  const pair = await generate();
  const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  await mkdir(KEYS_DIR, { recursive: true });
  await writeFile(path, `${JSON.stringify(jwk, null, 2)}\n`);
  return jwk;
}

function publicJwk(jwk: JsonWebKey): JsonWebKey {
  const { d: _d, p: _p, q: _q, dp: _dp, dq: _dq, qi: _qi, key_ops: _ops, ...rest } = jwk;
  return rest;
}

export async function loadTestKeys(): Promise<TestKeys> {
  const edJwk = await loadOrCreate(
    "ed25519",
    () => crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]),
  );
  const rsaJwk = await loadOrCreate("rsa", () =>
    crypto.subtle.generateKey(
      { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: Uint8Array.from([1, 0, 1]), hash: "SHA-256" },
      true,
      ["sign", "verify"],
    ),
  );
  const ed25519Private = await crypto.subtle.importKey("jwk", edJwk, { name: "Ed25519" }, false, ["sign"]);
  const rsaParams = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
  const rsaPrivate = await crypto.subtle.importKey("jwk", rsaJwk, rsaParams, false, ["sign"]);
  const rsaPublic = await crypto.subtle.importKey("jwk", publicJwk(rsaJwk), rsaParams, true, ["verify"]);
  const spki = new Uint8Array(await crypto.subtle.exportKey("spki", rsaPublic));
  const raw = base64UrlDecode(edJwk.x ?? "");
  if (raw === undefined) {
    throw new Error("Invalid Ed25519 test key");
  }
  const multikey = multibaseEncodeBase58(concatBytes(Uint8Array.from([0xed, 0x01]), raw));
  const didKey = `did:key:${multikey}`;
  return {
    ed25519Private,
    ed25519Public: publicJwk(edJwk),
    didKey,
    verificationMethod: `${didKey}#${multikey}`,
    rsaPrivate,
    rsaPublicPem: toPem(spki),
  };
}

function toPem(der: Uint8Array): string {
  const base64 = Buffer.from(der).toString("base64");
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join("\n")}\n-----END PUBLIC KEY-----\n`;
}
