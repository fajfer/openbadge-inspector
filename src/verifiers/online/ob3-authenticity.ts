// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { BadgeSummary, HttpClient, InspectionContext, Verifier, VerifierOutput } from "../../registry/types.ts";
import { asArray, isJsonObject, type JsonObject, readString } from "../../shared/json.ts";
import { check } from "../checks.ts";
import { findAssertionProof, verifyDataIntegrity } from "../crypto/data-integrity.ts";
import { ed25519FromMultikey, keyFromDidKey, keyFromJwk, type VerificationKey } from "../crypto/keys.ts";
import { verifyCompactJws } from "../crypto/signatures.ts";
import { embeddedJwtKey, jwsCheck } from "../offline/authenticity.ts";

const OK = 200;

export const ob3AuthenticityVerifier: Verifier = {
  id: "ob3-authenticity",
  mode: "online",
  appliesTo: needsRemoteKey,
  verify: verifyOnline,
};

function needsRemoteKey(summary: BadgeSummary): boolean {
  if (summary.spec !== "ob3") {
    return false;
  }
  if (summary.proofFormat === "vc-jwt") {
    return embeddedJwtKey(summary) === undefined;
  }
  if (summary.proofFormat === "data-integrity" && summary.document !== undefined) {
    const method = readString(findAssertionProof(summary.document), "verificationMethod");
    return method !== undefined && keyFromDidKey(method) === undefined;
  }
  return false;
}

async function verifyOnline(summary: BadgeSummary, context: InspectionContext): Promise<VerifierOutput> {
  const http = context.http;
  if (http === undefined) {
    return { checks: [check("authenticity", "not-run", "needs-online")] };
  }
  const resolve = (method: string) => resolveVerificationMethod(method, http);
  if (summary.proofFormat === "data-integrity" && summary.document !== undefined) {
    return { checks: [await verifyDataIntegrity(summary.document, resolve)] };
  }
  const header = summary.jws?.header;
  const method = readString(header, "kid") ?? readString(summary.jws?.payload, "iss");
  const key = method === undefined ? undefined : await resolve(method);
  if (summary.jws === undefined || key === undefined) {
    return { checks: [check("authenticity", "not-run", "key-unresolved", method)] };
  }
  return { checks: [jwsCheck(await verifyCompactJws(summary.jws, key))] };
}

export async function resolveVerificationMethod(
  method: string,
  http: HttpClient,
): Promise<VerificationKey | undefined> {
  const didKey = keyFromDidKey(method);
  if (didKey !== undefined) {
    return didKey;
  }
  const [base = "", fragment] = method.split("#");
  const documentUrl = base.startsWith("did:web:") ? didWebUrl(base) : base;
  if (documentUrl === undefined) {
    return undefined;
  }
  const response = await http.getJson(documentUrl);
  if (response.status !== OK || !isJsonObject(response.json)) {
    return undefined;
  }
  const candidates = [response.json, ...asArray(response.json.verificationMethod).filter(isJsonObject)];
  const match = candidates.find((candidate) => matchesMethod(candidate, method, base, fragment));
  return match === undefined ? undefined : keyFromMethod(match);
}

function matchesMethod(candidate: JsonObject, method: string, base: string, fragment: string | undefined): boolean {
  const id = readString(candidate, "id");
  if (id === undefined || keyFromMethod(candidate) === undefined) {
    return false;
  }
  return id === method || (fragment !== undefined && id === `#${fragment}`) || (fragment === undefined && id === base);
}

function keyFromMethod(method: JsonObject): VerificationKey | undefined {
  const multibase = readString(method, "publicKeyMultibase");
  if (multibase !== undefined) {
    return ed25519FromMultikey(multibase);
  }
  const jwk = method.publicKeyJwk;
  return isJsonObject(jwk) ? keyFromJwk(jwk) : undefined;
}

export function didWebUrl(did: string): string | undefined {
  const parts = did.slice("did:web:".length).split(":").map(decodeURIComponent);
  const [host, ...path] = parts;
  if (host === undefined || host.length === 0 || host.includes("/")) {
    return undefined;
  }
  return path.length === 0 ? `https://${host}/.well-known/did.json` : `https://${host}/${path.join("/")}/did.json`;
}
