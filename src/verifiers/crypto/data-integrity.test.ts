// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, it } from "vitest";
import rdfcSigned from "../../../tests/fixtures/w3c/eddsa-rdfc-2022-signed.json";
import jcsSigned from "../../../tests/fixtures/w3c/eddsa-jcs-2022-signed.json";
import examplesContext from "../../../tests/fixtures/w3c/credentials-examples-v2.json";
import type { JsonObject } from "../../shared/json.ts";
import { createDocumentLoader } from "../contexts/loader.ts";
import { jcsCanonicalizer, rdfcCanonicalizer } from "./canonicalize.ts";
import { verifyDataIntegrity } from "./data-integrity.ts";
import { keyFromDidKey } from "./keys.ts";

const EXAMPLES_CONTEXT_URL = "https://www.w3.org/ns/credentials/examples/v2";
const canonicalizers = {
  "eddsa-rdfc-2022": () => rdfcCanonicalizer(createDocumentLoader({ [EXAMPLES_CONTEXT_URL]: examplesContext })),
  "eddsa-jcs-2022": () => jcsCanonicalizer(),
};
const resolveDidKey = (method: string) => Promise.resolve(keyFromDidKey(method));

function tamper(document: JsonObject): JsonObject {
  return { ...document, name: "Tampered" };
}

describe("verifyDataIntegrity against W3C vc-di-eddsa test vectors", () => {
  it.each([
    ["eddsa-rdfc-2022", rdfcSigned as JsonObject],
    ["eddsa-jcs-2022", jcsSigned as JsonObject],
  ])("accepts the signed %s vector", async (_, document) => {
    const check = await verifyDataIntegrity(document, resolveDidKey, canonicalizers);
    expect(check).toEqual({ id: "authenticity", status: "pass", reason: "signature-valid" });
  });

  it.each([
    ["eddsa-rdfc-2022", rdfcSigned as JsonObject],
    ["eddsa-jcs-2022", jcsSigned as JsonObject],
  ])("rejects a tampered %s vector", async (_, document) => {
    const check = await verifyDataIntegrity(tamper(document), resolveDidKey, canonicalizers);
    expect(check.status).toBe("fail");
    expect(check.reason).toBe("signature-invalid");
  });

  it("reports an unbundled context instead of fetching it", async () => {
    const check = await verifyDataIntegrity(rdfcSigned, resolveDidKey);
    expect(check).toMatchObject({ status: "not-run", reason: "unknown-context", detail: EXAMPLES_CONTEXT_URL });
  });

  it("reports an unresolvable key", async () => {
    const check = await verifyDataIntegrity(rdfcSigned, () => Promise.resolve(undefined), canonicalizers);
    expect(check).toMatchObject({ status: "not-run", reason: "key-unresolved" });
  });

  it("reports an unsupported cryptosuite", async () => {
    const proof = { ...(rdfcSigned.proof as JsonObject), cryptosuite: "ecdsa-rdfc-2019" };
    const check = await verifyDataIntegrity({ ...(rdfcSigned as JsonObject), proof }, resolveDidKey, canonicalizers);
    expect(check).toMatchObject({ status: "not-run", reason: "unsupported-algorithm" });
  });
});
