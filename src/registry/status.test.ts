// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, it } from "vitest";
import { deriveStatus, mergeChecks } from "./status.ts";
import type { VerificationCheck } from "./types.ts";

const pass = (id: VerificationCheck["id"]): VerificationCheck => ({ id, status: "pass", reason: "schema-valid" });
const fail = (id: VerificationCheck["id"]): VerificationCheck => ({ id, status: "fail", reason: "expired" });
const notRun = (id: VerificationCheck["id"]): VerificationCheck => ({ id, status: "not-run", reason: "needs-online" });

describe("deriveStatus", () => {
  it.each([
    [[pass("schema"), pass("authenticity"), pass("expiry")], "verified"],
    [[pass("schema"), notRun("authenticity")], "unverified"],
    [[pass("schema"), pass("authenticity"), fail("expiry")], "expired"],
    [[fail("schema"), pass("authenticity"), fail("expiry")], "invalid"],
    [[pass("authenticity"), fail("revocation")], "invalid"],
    [[], "unverified"],
  ] as const)("%j → %s", (checks, expected) => {
    expect(deriveStatus(checks)).toBe(expected);
  });
});

describe("mergeChecks", () => {
  it("replaces checks by id and keeps display order", () => {
    const merged = mergeChecks([pass("expiry"), notRun("authenticity")], [pass("authenticity"), pass("schema")]);
    expect(merged.map((check) => [check.id, check.status])).toEqual([
      ["schema", "pass"],
      ["authenticity", "pass"],
      ["expiry", "pass"],
    ]);
  });
});
