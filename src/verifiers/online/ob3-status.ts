// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { BadgeSummary, HttpClient, InspectionContext, Verifier, VerifierOutput } from "../../registry/types.ts";
import { asArray, isJsonObject, type JsonObject, readObject, readString } from "../../shared/json.ts";
import { multibaseDecode } from "../../shared/multibase.ts";
import { base64UrlDecode, byteStream } from "../../shared/bytes.ts";
import { check } from "../checks.ts";

const OK = 200;
const MAX_STATUS_LIST_BYTES = 16 * 1024 * 1024;

export const ob3StatusVerifier: Verifier = {
  id: "ob3-status",
  mode: "online",
  appliesTo: (summary) => summary.spec === "ob3" && isJsonObject(summary.document?.credentialStatus),
  verify: verifyStatus,
};

async function verifyStatus(summary: BadgeSummary, context: InspectionContext): Promise<VerifierOutput> {
  const status = readObject(summary.document, "credentialStatus");
  const http = context.http;
  if (status === undefined || http === undefined) {
    return { checks: [check("revocation", "not-run", "needs-online")] };
  }
  switch (readString(status, "type")) {
    case "BitstringStatusListEntry":
    case "StatusList2021Entry":
      return { checks: [await checkBitstring(status, http)] };
    case "1EdTechRevocationList":
      return { checks: [await checkRevocationList(status, readString(summary.document, "id"), http)] };
    default:
      return { checks: [check("revocation", "not-run", "unsupported-algorithm", readString(status, "type"))] };
  }
}

async function checkBitstring(status: JsonObject, http: HttpClient) {
  const listUrl = readString(status, "statusListCredential");
  const index = Number(readString(status, "statusListIndex") ?? Number.NaN);
  const purpose = readString(status, "statusPurpose") ?? "revocation";
  if (listUrl === undefined || !Number.isInteger(index) || index < 0) {
    return check("revocation", "not-run", "status-unreachable", "Malformed credentialStatus");
  }
  const response = await http.getJson(listUrl);
  const encoded = readString(readObject(response.json as never, "credentialSubject"), "encodedList");
  const bits = encoded === undefined ? undefined : await decodeBitstring(encoded);
  if (response.status !== OK || bits === undefined) {
    return check("revocation", "not-run", "status-unreachable", listUrl);
  }
  const byte = bits[Math.floor(index / 8)];
  if (byte === undefined) {
    return check("revocation", "not-run", "status-unreachable", "Index outside the status list");
  }
  const set = (byte & (0x80 >> (index % 8))) !== 0;
  return set ? check("revocation", "fail", "revoked", purpose) : check("revocation", "pass", "not-revoked");
}

export async function decodeBitstring(encoded: string): Promise<Uint8Array | undefined> {
  const compressed = multibaseDecode(encoded) ?? base64UrlDecode(encoded);
  if (compressed === undefined) {
    return undefined;
  }
  try {
    const stream = byteStream(compressed).pipeThrough(new DecompressionStream("gzip"));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    return bytes.length > MAX_STATUS_LIST_BYTES ? undefined : bytes;
  } catch {
    return undefined;
  }
}

async function checkRevocationList(status: JsonObject, credentialId: string | undefined, http: HttpClient) {
  const listUrl = readString(status, "id");
  if (listUrl === undefined || credentialId === undefined) {
    return check("revocation", "not-run", "status-unreachable", "Malformed credentialStatus");
  }
  const response = await http.getJson(listUrl);
  if (response.status !== OK || !isJsonObject(response.json)) {
    return check("revocation", "not-run", "status-unreachable", listUrl);
  }
  const revoked = asArray(response.json.revokedCredentials).find(
    (entry) => entry === credentialId || readString(entry, "id") === credentialId,
  );
  return revoked === undefined
    ? check("revocation", "pass", "not-revoked")
    : check("revocation", "fail", "revoked", readString(revoked, "revocationReason"));
}
