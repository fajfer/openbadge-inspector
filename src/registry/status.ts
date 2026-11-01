// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { BadgeStatus, CheckId, VerificationCheck } from "./types.ts";

const CHECK_ORDER: readonly CheckId[] = ["schema", "authenticity", "revocation", "issued", "expiry"];

export function deriveStatus(checks: readonly VerificationCheck[]): BadgeStatus {
  const failures = checks.filter((check) => check.status === "fail");
  if (failures.some((check) => check.id !== "expiry")) {
    return "invalid";
  }
  if (failures.length > 0) {
    return "expired";
  }
  const authenticity = checks.find((check) => check.id === "authenticity");
  return authenticity?.status === "pass" ? "verified" : "unverified";
}

export function mergeChecks(
  current: readonly VerificationCheck[],
  incoming: readonly VerificationCheck[],
): VerificationCheck[] {
  const byId = new Map(current.map((check) => [check.id, check]));
  for (const check of incoming) {
    byId.set(check.id, check);
  }
  return [...byId.values()].sort((left, right) => CHECK_ORDER.indexOf(left.id) - CHECK_ORDER.indexOf(right.id));
}
