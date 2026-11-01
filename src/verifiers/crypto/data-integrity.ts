// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { CheckReason, VerificationCheck } from "../../registry/types.ts";
import { concatBytes, sha256, utf8Encode } from "../../shared/bytes.ts";
import { asArray, isJsonObject, type JsonObject, readString } from "../../shared/json.ts";
import { multibaseDecode } from "../../shared/multibase.ts";
import { UnknownContextError } from "../contexts/loader.ts";
import { CanonicalisationLimitError, type Canonicalizer, jcsCanonicalizer, rdfcCanonicalizer } from "./canonicalize.ts";
import type { VerificationKey } from "./keys.ts";
import { verifyEd25519 } from "./signatures.ts";

export type KeyResolver = (verificationMethod: string) => Promise<VerificationKey | undefined>;

const CRYPTOSUITES: Readonly<Record<string, () => Canonicalizer>> = {
  "eddsa-rdfc-2022": () => rdfcCanonicalizer(),
  "eddsa-jcs-2022": () => jcsCanonicalizer(),
};

export function findAssertionProof(document: JsonObject): JsonObject | undefined {
  return asArray(document.proof)
    .filter(isJsonObject)
    .find((proof) => readString(proof, "proofPurpose") === "assertionMethod");
}

export async function verifyDataIntegrity(
  document: JsonObject,
  resolveKey: KeyResolver,
  canonicalizers: Readonly<Record<string, () => Canonicalizer>> = CRYPTOSUITES,
): Promise<VerificationCheck> {
  const proof = findAssertionProof(document);
  if (proof === undefined) {
    return authenticity("fail", "signature-invalid", "No assertionMethod proof");
  }
  const cryptosuite = readString(proof, "cryptosuite");
  const canonicalizerFactory = cryptosuite === undefined ? undefined : canonicalizers[cryptosuite];
  const verificationMethod = readString(proof, "verificationMethod");
  const signature = multibaseDecode(readString(proof, "proofValue") ?? "");
  if (readString(proof, "type") !== "DataIntegrityProof" || canonicalizerFactory === undefined) {
    return authenticity("not-run", "unsupported-algorithm", cryptosuite ?? readString(proof, "type"));
  }
  if (verificationMethod === undefined || signature === undefined) {
    return authenticity("fail", "signature-invalid", "Proof is incomplete");
  }
  const key = await resolveKey(verificationMethod);
  if (key === undefined) {
    return authenticity("not-run", "key-unresolved", verificationMethod);
  }
  let data: Uint8Array<ArrayBuffer>;
  try {
    data = await hashData(document, proof, canonicalizerFactory());
  } catch (error) {
    if (error instanceof UnknownContextError) {
      return authenticity("not-run", "unknown-context", error.url);
    }
    if (error instanceof CanonicalisationLimitError) {
      return authenticity("not-run", "canonicalisation-limit");
    }
    return authenticity("fail", "signature-invalid", "The credential could not be canonicalised");
  }
  const outcome = await verifyEd25519(key, signature, data);
  if (outcome === "unsupported") {
    return authenticity("not-run", "unsupported-algorithm", "Ed25519");
  }
  return outcome === "valid" ? authenticity("pass", "signature-valid") : authenticity("fail", "signature-invalid");
}

export async function hashData(
  document: JsonObject,
  proof: JsonObject,
  canonicalize: Canonicalizer,
): Promise<Uint8Array<ArrayBuffer>> {
  const proofConfig: JsonObject = Object.fromEntries(Object.entries(proof).filter(([name]) => name !== "proofValue"));
  const context = document["@context"];
  if (context !== undefined) {
    proofConfig["@context"] = context;
  }
  const unsecured: JsonObject = Object.fromEntries(Object.entries(document).filter(([name]) => name !== "proof"));
  const [proofHash, documentHash] = await Promise.all([
    canonicalize(proofConfig).then((text) => sha256(utf8Encode(text))),
    canonicalize(unsecured).then((text) => sha256(utf8Encode(text))),
  ]);
  return concatBytes(proofHash, documentHash);
}

function authenticity(status: VerificationCheck["status"], reason: CheckReason, detail?: string): VerificationCheck {
  return detail === undefined ? { id: "authenticity", status, reason } : { id: "authenticity", status, reason, detail };
}
