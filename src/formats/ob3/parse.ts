// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { BadgeSummary, FormatParser, ProofFormat, RawPayload } from "../../registry/types.ts";
import { asArray, isJsonObject, type JsonObject, parseJsonObject, readObject, readString } from "../../shared/json.ts";
import { type CompactJws, decodeCompactJws } from "../../shared/jws.ts";
import { normaliseDate } from "../dates.ts";
import { schemaIssues } from "../schema-issues.ts";
import { unrecognisedSummary, withDefined } from "../summary.ts";
import { OB3_CONTEXT_PREFIX, VC_V1_CONTEXT, VC_V2_CONTEXT, credentialSchema } from "./credential.schema.ts";

export const ob3Format: FormatParser = {
  id: "ob3",
  accepts: (payload) => readCredential(payload) !== undefined,
  parse: parseOb3,
};

interface CredentialSource {
  readonly credential: JsonObject;
  readonly jws?: CompactJws;
}

function readCredential(payload: RawPayload): CredentialSource | undefined {
  if (payload.encoding === "json") {
    const credential = parseJsonObject(payload.text);
    return credential !== undefined && isCredential(credential) ? { credential } : undefined;
  }
  if (payload.encoding === "compact-jws") {
    const jws = decodeCompactJws(payload.text);
    if (jws === undefined) {
      return undefined;
    }
    const credential = readObject(jws.payload, "vc") ?? jws.payload;
    return isCredential(credential) ? { credential, jws } : undefined;
  }
  return undefined;
}

function isCredential(document: JsonObject): boolean {
  return asArray(document["@context"]).some(
    (context) =>
      context === VC_V1_CONTEXT ||
      context === VC_V2_CONTEXT ||
      (typeof context === "string" && context.startsWith(OB3_CONTEXT_PREFIX)),
  );
}

function parseOb3(payload: RawPayload): BadgeSummary {
  const source = readCredential(payload);
  return source === undefined ? unrecognisedSummary("Not a credential") : summariseCredential(source);
}

export function summariseCredential({ credential, jws }: CredentialSource): BadgeSummary {
  const subject = readObject(credential, "credentialSubject");
  const achievement = readObject(subject, "achievement");
  const issuerValue = credential.issuer;
  const issuer = isJsonObject(issuerValue) ? issuerValue : undefined;
  const identity = asArray(subject?.identifier).find(isJsonObject);
  const hashed = identity?.hashed;
  return withDefined<BadgeSummary>(
    {
      spec: "ob3",
      proofFormat: proofFormatOf(credential, jws),
      issuer: withDefined(
        {},
        {
          id: readString(issuer, "id") ?? (typeof issuerValue === "string" ? issuerValue : undefined),
          name: readString(issuer, "name"),
          url: readString(issuer, "url"),
        },
      ),
      recipient: withDefined(
        {},
        {
          type: readString(identity, "identityType") ?? (readString(subject, "id") === undefined ? undefined : "id"),
          hashed: typeof hashed === "boolean" ? hashed : undefined,
        },
      ),
      document: credential,
      schemaIssues: schemaIssues(credentialSchema.safeParse(credential)),
    },
    {
      name: readString(achievement, "name") ?? readString(credential, "name"),
      description: readString(achievement, "description") ?? readString(credential, "description"),
      issuedAt: normaliseDate(readString(credential, "validFrom") ?? readString(credential, "issuanceDate")),
      expiresAt: normaliseDate(readString(credential, "validUntil") ?? readString(credential, "expirationDate")),
      jws,
    },
  );
}

function proofFormatOf(credential: JsonObject, jws: CompactJws | undefined): ProofFormat {
  if (jws !== undefined) {
    return "vc-jwt";
  }
  return asArray(credential.proof).some(isJsonObject) ? "data-integrity" : "none";
}
