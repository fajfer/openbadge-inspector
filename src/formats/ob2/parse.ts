// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { BadgeSummary, FormatParser, RawPayload } from "../../registry/types.ts";
import {
  asArray,
  isJsonObject,
  type JsonObject,
  parseJsonObject,
  readObject,
  readString,
  readStringOrId,
} from "../../shared/json.ts";
import { type CompactJws, decodeCompactJws } from "../../shared/jws.ts";
import { normaliseDate } from "../dates.ts";
import { schemaIssues } from "../schema-issues.ts";
import { unrecognisedSummary, withDefined } from "../summary.ts";
import { OB2_CONTEXT, assertionSchema } from "./assertion.schema.ts";

export const ob2Format: FormatParser = {
  id: "ob2",
  accepts: acceptsOb2,
  parse: parseOb2,
};

function acceptsOb2(payload: RawPayload): boolean {
  switch (payload.encoding) {
    case "url":
      return payload.container !== "svg-credential";
    case "json":
      return looksLikeAssertion(parseJsonObject(payload.text));
    case "compact-jws":
      return looksLikeAssertion(decodeCompactJws(payload.text)?.payload);
    case "unknown":
      return false;
  }
}

function looksLikeAssertion(document: JsonObject | undefined): boolean {
  if (document === undefined) {
    return false;
  }
  const contexts = asArray(document["@context"]);
  if (contexts.includes(OB2_CONTEXT)) {
    return true;
  }
  return contexts.length === 0 && document.recipient !== undefined && document.badge !== undefined;
}

function parseOb2(payload: RawPayload): BadgeSummary {
  switch (payload.encoding) {
    case "url":
      return hostedUrlSummary(payload.text.trim());
    case "json": {
      const document = parseJsonObject(payload.text);
      return document === undefined ? unrecognisedSummary("Invalid JSON") : summariseAssertion(document);
    }
    case "compact-jws": {
      const jws = decodeCompactJws(payload.text);
      return jws === undefined ? unrecognisedSummary("Invalid JWS") : summariseAssertion(jws.payload, jws);
    }
    case "unknown":
      return unrecognisedSummary("Unrecognised payload");
  }
}

function hostedUrlSummary(url: string): BadgeSummary {
  return { spec: "ob2", proofFormat: "hosted", issuer: {}, recipient: {}, hostedUrl: url, schemaIssues: [] };
}

export function summariseAssertion(document: JsonObject, jws?: CompactJws): BadgeSummary {
  const badge = document.badge;
  const badgeClass = isJsonObject(badge) ? badge : undefined;
  const issuerValue = badgeClass?.issuer;
  const issuer = isJsonObject(issuerValue) ? issuerValue : undefined;
  const recipient = readObject(document, "recipient");
  const hashed = recipient?.hashed;
  return withDefined<BadgeSummary>(
    {
      spec: "ob2",
      proofFormat: jws === undefined ? "hosted" : "ob2-jws",
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
        { type: readString(recipient, "type"), hashed: typeof hashed === "boolean" ? hashed : undefined },
      ),
      document,
      schemaIssues: schemaIssues(assertionSchema.safeParse(document)),
    },
    {
      name: readString(badgeClass, "name"),
      description: readString(badgeClass, "description"),
      issuedAt: normaliseDate(readString(document, "issuedOn")),
      expiresAt: normaliseDate(readString(document, "expires")),
      hostedUrl: jws === undefined ? readString(document, "id") : undefined,
      badgeClassUrl: typeof badge === "string" ? badge : undefined,
      issuerUrl: typeof issuerValue === "string" ? issuerValue : readStringOrId(badgeClass, "issuer"),
      jws,
    },
  );
}
