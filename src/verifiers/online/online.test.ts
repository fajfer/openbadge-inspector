// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  FIXTURE_NOW,
  OB2_ASSERTION_URL,
  OB2_BADGE_URL,
  OB2_ISSUER_URL,
  OB2_KEY_URL,
  OB2_REVOCATION_URL,
  ob2Assertion,
  ob2BadgeClass,
  ob2Issuer,
} from "../../../tests/fixtures/credentials.ts";
import { fakeHttp, ok } from "../../../tests/fixtures/fake-http.ts";
import { fixtureInput, fixtureText } from "../../../tests/fixtures/load.ts";
import { defaultRegistry } from "../../registry/defaults.ts";
import { inspectImage } from "../../registry/inspect.ts";
import type { HttpJsonResponse, InspectionResult } from "../../registry/types.ts";
import { base64UrlEncode } from "../../shared/bytes.ts";

const registry = defaultRegistry();
const STATUS_LIST_URL = "https://university.example/status/1";
const SIGNED_ASSERTION_ID = "urn:uuid:5d6f0b6e-2b1c-4f8e-9c1a-0d6e3d2b9f01";

async function inspectOnline(file: string, responses: Readonly<Record<string, HttpJsonResponse>>) {
  const http = fakeHttp(responses);
  const result = await inspectImage(registry, fixtureInput(file), { now: FIXTURE_NOW, mode: "online", http });
  return { result, requests: http.requests };
}

function checkOf(result: InspectionResult, id: string) {
  return result.checks.find((check) => check.id === id);
}

function statusList(revokedIndex?: number): string {
  const bits = new Uint8Array(16 * 1024);
  if (revokedIndex !== undefined) {
    bits[Math.floor(revokedIndex / 8)] = 0x80 >> (revokedIndex % 8);
  }
  return `u${base64UrlEncode(new Uint8Array(gzipSync(bits)))}`;
}

const ob2Linked = {
  [OB2_BADGE_URL]: ok(ob2BadgeClass()),
  [OB2_ISSUER_URL]: ok(ob2Issuer()),
};

describe("OB 2.0 hosted verification", () => {
  it("verifies a baked assertion against the hosted copy", async () => {
    const { result } = await inspectOnline("png/ob2-hosted.png", {
      [OB2_ASSERTION_URL]: ok(ob2Assertion({ embedded: true, signed: false })),
    });
    expect(result.status).toBe("verified");
    expect(checkOf(result, "revocation")).toMatchObject({ status: "pass" });
  });

  it("loads the badge class and issuer for a URL-only payload", async () => {
    const { result } = await inspectOnline("png/ob2-hosted-url.png", {
      [OB2_ASSERTION_URL]: ok(ob2Assertion({ embedded: false, signed: false })),
      ...ob2Linked,
    });
    expect(result.status).toBe("verified");
    expect(result.badge).toMatchObject({
      name: "Web Literacy",
      issuer: { name: "Example Learning Lab", url: "https://issuer.example" },
      issuedAt: "2026-01-15T10:00:00.000Z",
    });
    expect(result.checks.map((check) => check.id)).toEqual([
      "schema",
      "authenticity",
      "revocation",
      "issued",
      "expiry",
    ]);
  });

  it("treats HTTP 410 as revoked", async () => {
    const { result } = await inspectOnline("png/ob2-hosted.png", { [OB2_ASSERTION_URL]: { status: 410 } });
    expect(result.status).toBe("invalid");
    expect(checkOf(result, "revocation")).toMatchObject({ status: "fail", reason: "revoked" });
  });

  it("treats revoked: true as revoked", async () => {
    const { result } = await inspectOnline("png/ob2-hosted.png", {
      [OB2_ASSERTION_URL]: ok({ ...ob2Assertion({ embedded: true, signed: false }), revoked: true }),
    });
    expect(result.status).toBe("invalid");
  });

  it("rejects a hosted assertion for a different recipient", async () => {
    const hosted = ob2Assertion({ embedded: true, signed: false });
    const { result } = await inspectOnline("png/ob2-hosted.png", {
      [OB2_ASSERTION_URL]: ok({ ...hosted, recipient: { type: "email", hashed: false, identity: "x@example.org" } }),
    });
    expect(result.status).toBe("invalid");
    expect(checkOf(result, "authenticity")).toMatchObject({ status: "fail", reason: "hosted-mismatch" });
  });

  it("stays unverified when the issuer is unreachable", async () => {
    const { result } = await inspectOnline("png/ob2-hosted.png", { [OB2_ASSERTION_URL]: { status: 0 } });
    expect(result.status).toBe("unverified");
    expect(checkOf(result, "authenticity")).toMatchObject({ status: "not-run", reason: "hosted-unreachable" });
  });
});

describe("OB 2.0 signed verification", () => {
  const signedResponses = {
    [OB2_KEY_URL]: ok({ id: OB2_KEY_URL, owner: OB2_ISSUER_URL, publicKeyPem: fixtureText("online/ob2-key.pem") }),
    ...ob2Linked,
  };

  it("verifies the JWS with the issuer's key", async () => {
    const { result } = await inspectOnline("png/ob2-signed.png", {
      ...signedResponses,
      [OB2_REVOCATION_URL]: ok({ revokedAssertions: [] }),
    });
    expect(result.status).toBe("verified");
    expect(result.badge?.name).toBe("Web Literacy");
  });

  it("finds the assertion on the revocation list", async () => {
    const { result } = await inspectOnline("png/ob2-signed.png", {
      ...signedResponses,
      [OB2_REVOCATION_URL]: ok({ revokedAssertions: [{ id: SIGNED_ASSERTION_ID, revocationReason: "Misconduct" }] }),
    });
    expect(result.status).toBe("invalid");
    expect(checkOf(result, "revocation")).toMatchObject({ reason: "revoked", detail: "Misconduct" });
  });

  it("rejects a key owned by someone else", async () => {
    const { result } = await inspectOnline("png/ob2-signed.png", {
      ...signedResponses,
      [OB2_KEY_URL]: ok({ owner: "https://elsewhere.example", publicKeyPem: fixtureText("online/ob2-key.pem") }),
    });
    expect(result.status).toBe("invalid");
  });
});

describe("OB 3.0 online checks", () => {
  it("resolves a did:web key", async () => {
    const { result, requests } = await inspectOnline("png/ob3-didweb.png", {
      "https://university.example/.well-known/did.json": ok(JSON.parse(fixtureText("online/did-web.json"))),
    });
    expect(requests).toEqual(["https://university.example/.well-known/did.json"]);
    expect(result.status).toBe("verified");
  });

  it("leaves the badge unverified when did:web can't be resolved", async () => {
    const { result } = await inspectOnline("png/ob3-didweb.png", {});
    expect(result.status).toBe("unverified");
    expect(checkOf(result, "authenticity")).toMatchObject({ reason: "key-unresolved" });
  });

  it.each([
    [undefined, "verified"],
    [42, "invalid"],
    [41, "verified"],
  ])("reads the bitstring status list (revoked index %s)", async (revokedIndex, expected) => {
    const { result } = await inspectOnline("png/ob3-revocable.png", {
      [STATUS_LIST_URL]: ok({ credentialSubject: { encodedList: statusList(revokedIndex) } }),
    });
    expect(result.status).toBe(expected);
  });

  it("does not contact anything for a did:key credential without status", async () => {
    const { result, requests } = await inspectOnline("png/ob3-rdfc.png", {});
    expect(result.status).toBe("verified");
    expect(requests).toEqual([]);
  });
});

describe("offline mode", () => {
  it("never calls the network", async () => {
    const http = fakeHttp({});
    for (const file of ["png/ob2-hosted.png", "png/ob2-signed.png", "png/ob3-didweb.png", "png/ob3-revocable.png"]) {
      await inspectImage(registry, fixtureInput(file), { now: FIXTURE_NOW, mode: "offline", http });
    }
    expect(http.requests).toEqual([]);
  });
});
