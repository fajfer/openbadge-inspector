// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type {
  BadgeSummary,
  HttpClient,
  InspectionContext,
  VerificationCheck,
  Verifier,
  VerifierOutput,
} from "../../registry/types.ts";
import { asArray, isJsonObject, readObject, readString } from "../../shared/json.ts";
import { check } from "../checks.ts";
import { keyFromPem } from "../crypto/keys.ts";
import { verifyCompactJws } from "../crypto/signatures.ts";
import { jwsCheck } from "../offline/authenticity.ts";
import { withLinkedObjects } from "./ob2-hosted.ts";

const OK = 200;

export const ob2SignedVerifier: Verifier = {
  id: "ob2-signed",
  mode: "online",
  appliesTo: (summary) => summary.spec === "ob2" && summary.proofFormat === "ob2-jws",
  verify: verifySigned,
};

async function verifySigned(summary: BadgeSummary, context: InspectionContext): Promise<VerifierOutput> {
  const http = context.http;
  if (http === undefined || summary.jws === undefined) {
    return { checks: [check("authenticity", "not-run", "needs-online")] };
  }
  const enriched = await withLinkedObjects(summary, http);
  const authenticity = await verifyWithCreatorKey(enriched, http);
  const revocation = await checkRevocationList(enriched, http);
  return {
    checks: [authenticity, revocation],
    summaryPatch: { issuer: enriched.issuer, ...(enriched.name === undefined ? {} : { name: enriched.name }) },
  };
}

async function verifyWithCreatorKey(summary: BadgeSummary, http: HttpClient): Promise<VerificationCheck> {
  const creator = readString(readObject(summary.document, "verification"), "creator");
  if (creator === undefined || summary.jws === undefined) {
    return check("authenticity", "not-run", "key-unresolved", "The assertion names no signing key");
  }
  const response = await http.getJson(creator);
  const pem = response.status === OK ? readString(response.json as never, "publicKeyPem") : undefined;
  const key = pem === undefined ? undefined : keyFromPem(pem);
  if (key === undefined) {
    return check("authenticity", "not-run", "key-unresolved", creator);
  }
  const owner = readString(response.json as never, "owner");
  if (owner !== undefined && summary.issuerUrl !== undefined && owner !== summary.issuerUrl) {
    return check("authenticity", "fail", "signature-invalid", "The signing key doesn't belong to the issuer");
  }
  return jwsCheck(await verifyCompactJws(summary.jws, key));
}

async function checkRevocationList(summary: BadgeSummary, http: HttpClient): Promise<VerificationCheck> {
  if (summary.issuerUrl === undefined) {
    return check("revocation", "not-run", "status-unreachable");
  }
  const issuer = await http.getJson(summary.issuerUrl);
  const listUrl = issuer.status === OK ? readString(issuer.json as never, "revocationList") : undefined;
  if (listUrl === undefined) {
    return check("revocation", "pass", "not-revoked", "The issuer publishes no revocation list");
  }
  const list = await http.getJson(listUrl);
  if (list.status !== OK || !isJsonObject(list.json)) {
    return check("revocation", "not-run", "status-unreachable", listUrl);
  }
  const ids = new Set([readString(summary.document, "id"), readString(summary.document, "uid")]);
  const revoked = asArray(list.json.revokedAssertions).find((entry) =>
    ids.has(typeof entry === "string" ? entry : (readString(entry, "id") ?? readString(entry, "uid"))),
  );
  return revoked === undefined
    ? check("revocation", "pass", "not-revoked")
    : check("revocation", "fail", "revoked", readString(revoked, "revocationReason"));
}
