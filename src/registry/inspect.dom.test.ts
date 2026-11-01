// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, it } from "vitest";
import { FIXTURES } from "../../tests/fixtures/catalog.ts";
import { FIXTURE_NOW } from "../../tests/fixtures/credentials.ts";
import { fixtureInput } from "../../tests/fixtures/load.ts";
import { defaultRegistry } from "./defaults.ts";
import { inspectImage } from "./inspect.ts";

const registry = defaultRegistry();
const offline = { now: FIXTURE_NOW, mode: "offline" as const };

describe("inspectImage on the fixture catalogue (offline)", () => {
  it.each(FIXTURES.map((fixture) => [fixture.file, fixture.offlineStatus] as const))(
    "%s is %s",
    async (file, expected) => {
      const result = await inspectImage(registry, fixtureInput(file), offline);
      expect(result.status).toBe(expected);
    },
  );

  it("summarises an OB 3.0 credential for the card", async () => {
    const result = await inspectImage(registry, fixtureInput("png/ob3-rdfc.png"), offline);
    expect(result.badge).toMatchObject({
      spec: "ob3",
      proofFormat: "data-integrity",
      name: "Open Badges Practitioner",
      issuer: { name: "Example University", url: "https://university.example" },
      issuedAt: "2026-01-15T10:00:00.000Z",
      expiresAt: "2031-01-01T00:00:00.000Z",
      recipient: { type: "emailAddress", hashed: true },
    });
    expect(result.checks.map((check) => [check.id, check.status])).toEqual([
      ["schema", "pass"],
      ["authenticity", "pass"],
      ["issued", "pass"],
      ["expiry", "pass"],
    ]);
  });

  it("explains why an expired badge is orange", async () => {
    const result = await inspectImage(registry, fixtureInput("png/ob3-expired.png"), offline);
    expect(result.checks.find((check) => check.id === "expiry")).toMatchObject({ status: "fail", reason: "expired" });
    expect(result.checks.find((check) => check.id === "authenticity")?.status).toBe("pass");
  });

  it("marks hosted OB 2.0 badges as needing an online check", async () => {
    const result = await inspectImage(registry, fixtureInput("png/ob2-hosted.png"), offline);
    expect(result.onlineAvailable).toBe(true);
    expect(result.badge).toMatchObject({ name: "Web Literacy", issuer: { name: "Example Learning Lab" } });
    expect(result.checks.find((check) => check.id === "authenticity")).toMatchObject({ reason: "needs-online" });
  });

  it("treats a tampered credential as invalid", async () => {
    const result = await inspectImage(registry, fixtureInput("png/ob3-tampered.png"), offline);
    expect(result.checks.find((check) => check.id === "authenticity")).toMatchObject({
      status: "fail",
      reason: "signature-invalid",
    });
  });

  it("never runs scripts embedded in a baked SVG", async () => {
    document.title = "untouched";
    await inspectImage(registry, fixtureInput("svg/ob3-with-script.svg"), offline);
    expect(document.title).toBe("untouched");
  });
});
