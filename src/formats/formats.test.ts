// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, it } from "vitest";
import { ob2Assertion } from "../../tests/fixtures/credentials.ts";
import type { RawPayload } from "../registry/types.ts";
import type { JsonObject } from "../shared/json.ts";
import { ob2Format } from "./ob2/parse.ts";
import { ob3Format } from "./ob3/parse.ts";

function jsonPayload(document: JsonObject): RawPayload {
  return { container: "png-itxt", encoding: "json", text: JSON.stringify(document) };
}

const minimalOb3: JsonObject = {
  "@context": ["https://www.w3.org/2018/credentials/v1", "https://purl.imsglobal.org/spec/ob/v3p0/context.json"],
  type: ["VerifiableCredential", "AchievementCredential"],
  issuer: "https://issuer.example",
  issuanceDate: "2024-03-01T00:00:00Z",
  expirationDate: "2030-03-01T00:00:00Z",
  credentialSubject: {
    id: "did:example:learner",
    achievement: { id: "urn:a", type: "Achievement", name: "Legacy", description: "VC 1.1 style", criteria: {} },
  },
};

describe("format detection", () => {
  it("routes OB 3.0 credentials to ob3 and OB 2.0 assertions to ob2", () => {
    const ob2 = jsonPayload(ob2Assertion({ embedded: false, signed: false }));
    const ob3 = jsonPayload(minimalOb3);
    expect([ob3Format.accepts(ob3), ob2Format.accepts(ob3)]).toEqual([true, false]);
    expect([ob3Format.accepts(ob2), ob2Format.accepts(ob2)]).toEqual([false, true]);
  });

  it("does not treat a URL in an SVG credential element as OB 2.0", () => {
    expect(ob2Format.accepts({ container: "svg-credential", encoding: "url", text: "https://a.example" })).toBe(false);
  });
});

describe("ob3Format", () => {
  it("accepts VC 1.1 date names as aliases", () => {
    expect(ob3Format.parse(jsonPayload(minimalOb3))).toMatchObject({
      name: "Legacy",
      issuer: { id: "https://issuer.example" },
      issuedAt: "2024-03-01T00:00:00.000Z",
      expiresAt: "2030-03-01T00:00:00.000Z",
      recipient: { type: "id" },
      proofFormat: "none",
      schemaIssues: [],
    });
  });

  it("lists schema problems with their path", () => {
    const broken = { ...minimalOb3, type: ["VerifiableCredential"], validFrom: "yesterday" };
    expect(ob3Format.parse(jsonPayload(broken)).schemaIssues).toEqual([
      "type: Must include OpenBadgeCredential",
      "validFrom: Not a valid ISO 8601 date",
    ]);
  });
});

describe("ob2Format", () => {
  it("summarises a hosted URL without fetching it", () => {
    expect(ob2Format.parse({ container: "png-itxt", encoding: "url", text: " https://i.example/a.json " })).toEqual({
      spec: "ob2",
      proofFormat: "hosted",
      issuer: {},
      recipient: {},
      hostedUrl: "https://i.example/a.json",
      schemaIssues: [],
    });
  });

  it("reports a missing recipient", () => {
    const { recipient: _recipient, ...withoutRecipient } = ob2Assertion({ embedded: false, signed: false });
    expect(ob2Format.parse(jsonPayload(withoutRecipient)).schemaIssues[0]).toMatch(/^recipient:/);
  });
});
