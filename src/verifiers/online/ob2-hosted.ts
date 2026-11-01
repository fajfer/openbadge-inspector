// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { summariseAssertion } from "../../formats/ob2/parse.ts";
import type {
  BadgeSummary,
  HttpClient,
  InspectionContext,
  VerificationCheck,
  Verifier,
  VerifierOutput,
} from "../../registry/types.ts";
import { isJsonObject, type JsonObject, readObject, readString } from "../../shared/json.ts";
import { check } from "../checks.ts";
import { dateChecks } from "../offline/dates.ts";

const GONE = 410;
const OK = 200;

export const ob2HostedVerifier: Verifier = {
  id: "ob2-hosted",
  mode: "online",
  appliesTo: (summary) => summary.spec === "ob2" && summary.proofFormat === "hosted" && summary.hostedUrl !== undefined,
  verify: verifyHosted,
};

async function verifyHosted(summary: BadgeSummary, context: InspectionContext): Promise<VerifierOutput> {
  const http = context.http;
  const url = summary.hostedUrl;
  if (http === undefined || url === undefined) {
    return { checks: [check("authenticity", "not-run", "needs-online")] };
  }
  const response = await http.getJson(url);
  if (response.status === GONE) {
    return {
      checks: [
        check("authenticity", "not-run", "hosted-unreachable", url),
        check("revocation", "fail", "revoked", "The issuer reports this assertion as gone (HTTP 410)"),
      ],
    };
  }
  if (response.status !== OK || !isJsonObject(response.json)) {
    return {
      checks: [
        check("authenticity", "not-run", "hosted-unreachable", url),
        check("revocation", "not-run", "status-unreachable"),
      ],
    };
  }
  const hosted = response.json;
  const mismatch = compareHosted(summary.document, hosted, url);
  const revoked = hosted.revoked === true;
  const fetched = await withLinkedObjects(summariseAssertion(hosted), http);
  const checks: VerificationCheck[] = [
    mismatch === undefined
      ? check("authenticity", "pass", "hosted-match", url)
      : check("authenticity", "fail", "hosted-mismatch", mismatch),
    revoked
      ? check("revocation", "fail", "revoked", readString(hosted, "revocationReason"))
      : check("revocation", "pass", "not-revoked"),
    ...dateChecks(fetched, context.now),
  ];
  if (summary.document === undefined) {
    checks.unshift(
      fetched.schemaIssues.length === 0
        ? check("schema", "pass", "schema-valid")
        : check("schema", "fail", "schema-invalid", fetched.schemaIssues.join("; ")),
    );
  }
  return { checks, summaryPatch: patchFrom(fetched) };
}

function compareHosted(baked: JsonObject | undefined, hosted: JsonObject, url: string): string | undefined {
  if (readString(hosted, "id") !== url) {
    return "The hosted assertion's id doesn't match its URL";
  }
  if (baked === undefined) {
    return undefined;
  }
  if (readString(baked, "id") !== readString(hosted, "id")) {
    return "The baked assertion id differs from the hosted one";
  }
  const bakedIdentity = readString(readObject(baked, "recipient"), "identity");
  const hostedIdentity = readString(readObject(hosted, "recipient"), "identity");
  if (bakedIdentity !== hostedIdentity) {
    return "The recipient differs from the hosted assertion";
  }
  if (badgeId(baked) !== badgeId(hosted)) {
    return "The badge differs from the hosted assertion";
  }
  return undefined;
}

function badgeId(assertion: JsonObject): string | undefined {
  return readString(assertion, "badge") ?? readString(readObject(assertion, "badge"), "id");
}

export async function withLinkedObjects(summary: BadgeSummary, http: HttpClient): Promise<BadgeSummary> {
  let result = summary;
  if (result.badgeClassUrl !== undefined && result.name === undefined) {
    const badgeClass = await fetchObject(http, result.badgeClassUrl);
    if (badgeClass !== undefined) {
      const issuerValue = badgeClass.issuer;
      result = {
        ...result,
        ...defined({
          name: readString(badgeClass, "name"),
          description: readString(badgeClass, "description"),
          issuerUrl: typeof issuerValue === "string" ? issuerValue : readString(readObject(badgeClass, "issuer"), "id"),
        }),
      };
      if (isJsonObject(issuerValue)) {
        result = { ...result, issuer: issuerFrom(issuerValue) };
      }
    }
  }
  if (result.issuerUrl !== undefined && result.issuer.name === undefined) {
    const issuer = await fetchObject(http, result.issuerUrl);
    if (issuer !== undefined) {
      result = { ...result, issuer: issuerFrom(issuer) };
    }
  }
  return result;
}

async function fetchObject(http: HttpClient, url: string): Promise<JsonObject | undefined> {
  const response = await http.getJson(url);
  return response.status === OK && isJsonObject(response.json) ? response.json : undefined;
}

function issuerFrom(issuer: JsonObject): BadgeSummary["issuer"] {
  return defined({ id: readString(issuer, "id"), name: readString(issuer, "name"), url: readString(issuer, "url") });
}

function patchFrom(fetched: BadgeSummary): Partial<BadgeSummary> {
  return defined({
    name: fetched.name,
    description: fetched.description,
    issuer: fetched.issuer,
    issuedAt: fetched.issuedAt,
    expiresAt: fetched.expiresAt,
    recipient: fetched.recipient,
    issuerUrl: fetched.issuerUrl,
  });
}

function defined<T extends object>(value: { [K in keyof T]: T[K] | undefined }): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Partial<T>;
}
