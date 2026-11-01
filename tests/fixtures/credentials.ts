// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { base64UrlEncode, utf8Encode } from "../../src/shared/bytes.ts";
import type { JsonObject } from "../../src/shared/json.ts";
import { multibaseEncodeBase58 } from "../../src/shared/multibase.ts";
import { jcsCanonicalizer, rdfcCanonicalizer } from "../../src/verifiers/crypto/canonicalize.ts";
import { hashData } from "../../src/verifiers/crypto/data-integrity.ts";
import type { TestKeys } from "./keys.ts";

export const FIXTURE_ISSUED = "2026-01-15T10:00:00Z";
export const FIXTURE_VALID_UNTIL = "2031-01-01T00:00:00Z";
export const FIXTURE_EXPIRED = "2025-01-01T00:00:00Z";
export const FIXTURE_NOW = new Date("2026-06-01T12:00:00Z");

export const OB2_ISSUER_URL = "https://issuer.example/issuer.json";
export const OB2_BADGE_URL = "https://issuer.example/badges/web-literacy.json";
export const OB2_ASSERTION_URL = "https://issuer.example/assertions/1001.json";
export const OB2_KEY_URL = "https://issuer.example/keys/1.json";
export const OB2_REVOCATION_URL = "https://issuer.example/revocations.json";

export function ob2Issuer(): JsonObject {
  return {
    "@context": "https://w3id.org/openbadges/v2",
    type: "Issuer",
    id: OB2_ISSUER_URL,
    name: "Example Learning Lab",
    url: "https://issuer.example",
    email: "badges@issuer.example",
    revocationList: OB2_REVOCATION_URL,
  };
}

export function ob2BadgeClass(): JsonObject {
  return {
    "@context": "https://w3id.org/openbadges/v2",
    type: "BadgeClass",
    id: OB2_BADGE_URL,
    name: "Web Literacy",
    description: "Awarded for completing the Web Literacy course.",
    image: "https://issuer.example/badges/web-literacy.png",
    criteria: { narrative: "Complete all six modules." },
    issuer: OB2_ISSUER_URL,
  };
}

export function ob2Assertion(options: { embedded: boolean; signed: boolean; id?: string }): JsonObject {
  const id = options.id ?? OB2_ASSERTION_URL;
  return {
    "@context": "https://w3id.org/openbadges/v2",
    type: "Assertion",
    id: options.signed ? "urn:uuid:5d6f0b6e-2b1c-4f8e-9c1a-0d6e3d2b9f01" : id,
    recipient: {
      type: "email",
      hashed: true,
      salt: "deadsea",
      identity: "sha256$c7ef86405ba71b85acd8e2e95166c4b111448089f2e1599f42fe1bba46e865c5",
    },
    badge: options.embedded ? { ...ob2BadgeClass(), issuer: ob2Issuer() } : OB2_BADGE_URL,
    verification: options.signed ? { type: "SignedBadge", creator: OB2_KEY_URL } : { type: "HostedBadge" },
    issuedOn: FIXTURE_ISSUED,
  };
}

export function ob3Credential(keys: TestKeys, overrides: Partial<JsonObject> = {}): JsonObject {
  return {
    "@context": ["https://www.w3.org/ns/credentials/v2", "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"],
    id: "urn:uuid:a63a60be-f4af-491c-87fc-2c8fd3007a58",
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    issuer: {
      id: keys.didKey,
      type: ["Profile"],
      name: "Example University",
      url: "https://university.example",
    },
    validFrom: FIXTURE_ISSUED,
    validUntil: FIXTURE_VALID_UNTIL,
    name: "Open Badges Practitioner",
    credentialSubject: {
      type: ["AchievementSubject"],
      identifier: [
        {
          type: "IdentityObject",
          identityType: "emailAddress",
          hashed: true,
          identityHash: "sha256$c7ef86405ba71b85acd8e2e95166c4b111448089f2e1599f42fe1bba46e865c5",
          salt: "deadsea",
        },
      ],
      achievement: {
        id: "https://university.example/achievements/practitioner",
        type: ["Achievement"],
        name: "Open Badges Practitioner",
        description: "Demonstrated the ability to issue and verify Open Badges 3.0 credentials.",
        criteria: { narrative: "Issue three badges and verify them with an independent verifier." },
      },
    },
    ...overrides,
  };
}

export async function signDataIntegrity(
  keys: TestKeys,
  credential: JsonObject,
  cryptosuite: "eddsa-rdfc-2022" | "eddsa-jcs-2022",
  verificationMethod = keys.verificationMethod,
): Promise<JsonObject> {
  const proof: JsonObject = {
    type: "DataIntegrityProof",
    cryptosuite,
    created: FIXTURE_ISSUED,
    verificationMethod,
    proofPurpose: "assertionMethod",
  };
  const canonicalize = cryptosuite === "eddsa-rdfc-2022" ? rdfcCanonicalizer() : jcsCanonicalizer();
  const data = await hashData(credential, proof, canonicalize);
  const signature = new Uint8Array(await crypto.subtle.sign("Ed25519", keys.ed25519Private, data));
  return { ...credential, proof: { ...proof, proofValue: multibaseEncodeBase58(signature) } };
}

export async function signCompactJws(
  header: JsonObject,
  payload: JsonObject,
  key: CryptoKey,
  algorithm: AlgorithmIdentifier,
): Promise<string> {
  const signingInput = `${base64UrlEncode(utf8Encode(JSON.stringify(header)))}.${base64UrlEncode(
    utf8Encode(JSON.stringify(payload)),
  )}`;
  const signature = new Uint8Array(await crypto.subtle.sign(algorithm, key, utf8Encode(signingInput)));
  return `${signingInput}.${base64UrlEncode(signature)}`;
}

export async function ob3VcJwt(keys: TestKeys): Promise<string> {
  const credential = ob3Credential(keys);
  return signCompactJws(
    { alg: "EdDSA", typ: "JWT", kid: keys.verificationMethod },
    { iss: keys.didKey, jti: credential.id ?? null, nbf: 1768471200, exp: 1925078400, vc: credential },
    keys.ed25519Private,
    "Ed25519",
  );
}

export async function ob2SignedJws(keys: TestKeys): Promise<string> {
  return signCompactJws(
    { alg: "RS256" },
    ob2Assertion({ embedded: false, signed: true }),
    keys.rsaPrivate,
    "RSASSA-PKCS1-v1_5",
  );
}
