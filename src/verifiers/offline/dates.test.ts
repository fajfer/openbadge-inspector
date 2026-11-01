// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, it } from "vitest";
import type { BadgeSummary } from "../../registry/types.ts";
import { CLOCK_SKEW_MS, dateChecks } from "./dates.ts";

const NOW = new Date("2026-06-01T12:00:00Z");
const base: BadgeSummary = { spec: "ob3", proofFormat: "none", issuer: {}, recipient: {}, schemaIssues: [] };

describe("dateChecks", () => {
  it("accepts an issue date within the clock skew", () => {
    const issuedAt = new Date(NOW.getTime() + CLOCK_SKEW_MS - 1000).toISOString();
    expect(dateChecks({ ...base, issuedAt }, NOW)[0]).toMatchObject({ status: "pass" });
  });

  it("rejects an issue date in the future", () => {
    const issuedAt = new Date(NOW.getTime() + CLOCK_SKEW_MS + 1000).toISOString();
    expect(dateChecks({ ...base, issuedAt }, NOW)[0]).toMatchObject({ status: "fail", reason: "issued-in-future" });
  });

  it("requires an issue date", () => {
    expect(dateChecks(base, NOW)[0]).toMatchObject({ status: "fail", reason: "issued-missing" });
  });

  it("treats the expiry instant as expired", () => {
    const checks = dateChecks({ ...base, issuedAt: "2026-01-01T00:00:00Z", expiresAt: NOW.toISOString() }, NOW);
    expect(checks[1]).toMatchObject({ status: "fail", reason: "expired" });
  });

  it("passes when there is no expiry", () => {
    expect(dateChecks({ ...base, issuedAt: "2026-01-01T00:00:00Z" }, NOW)[1]).toMatchObject({ reason: "no-expiry" });
  });
});
