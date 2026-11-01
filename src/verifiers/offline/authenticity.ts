// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { BadgeSummary, VerificationCheck, Verifier } from "../../registry/types.ts";
import { isJsonObject, readString } from "../../shared/json.ts";
import { check } from "../checks.ts";
import { verifyDataIntegrity } from "../crypto/data-integrity.ts";
import { keyFromDidKey, keyFromJwk, type VerificationKey } from "../crypto/keys.ts";
import { verifyCompactJws } from "../crypto/signatures.ts";

export const offlineAuthenticityVerifier: Verifier = {
  id: "offline-authenticity",
  mode: "offline",
  appliesTo: (summary) => summary.spec !== "unknown",
  verify: async (summary) => ({ checks: [await offlineAuthenticity(summary)] }),
};

async function offlineAuthenticity(summary: BadgeSummary): Promise<VerificationCheck> {
  switch (summary.proofFormat) {
    case "hosted":
    case "ob2-jws":
      return check("authenticity", "not-run", "needs-online");
    case "none":
      return check("authenticity", "fail", "signature-invalid", "The credential has no proof");
    case "data-integrity":
      return summary.document === undefined
        ? check("authenticity", "fail", "signature-invalid")
        : verifyDataIntegrity(summary.document, (method) => Promise.resolve(keyFromDidKey(method)));
    case "vc-jwt":
      return verifyVcJwtOffline(summary);
  }
}

export function embeddedJwtKey(summary: BadgeSummary): VerificationKey | undefined {
  const header = summary.jws?.header;
  const jwk = header?.jwk;
  if (isJsonObject(jwk)) {
    return keyFromJwk(jwk);
  }
  const kid = readString(header, "kid");
  return kid === undefined ? undefined : keyFromDidKey(kid);
}

async function verifyVcJwtOffline(summary: BadgeSummary): Promise<VerificationCheck> {
  const key = embeddedJwtKey(summary);
  if (summary.jws === undefined) {
    return check("authenticity", "fail", "signature-invalid");
  }
  if (key === undefined) {
    return check("authenticity", "not-run", "needs-online");
  }
  return jwsCheck(await verifyCompactJws(summary.jws, key));
}

export function jwsCheck(outcome: "valid" | "invalid" | "unsupported"): VerificationCheck {
  switch (outcome) {
    case "valid":
      return check("authenticity", "pass", "signature-valid");
    case "invalid":
      return check("authenticity", "fail", "signature-invalid");
    case "unsupported":
      return check("authenticity", "not-run", "unsupported-algorithm");
  }
}
