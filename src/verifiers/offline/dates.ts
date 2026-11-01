// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { BadgeSummary, VerificationCheck, Verifier } from "../../registry/types.ts";
import { check } from "../checks.ts";

export const CLOCK_SKEW_MS = 5 * 60 * 1000;

export const datesVerifier: Verifier = {
  id: "dates",
  mode: "offline",
  appliesTo: (summary) => summary.document !== undefined,
  verify: (summary, context) => Promise.resolve({ checks: dateChecks(summary, context.now) }),
};

export function dateChecks(summary: BadgeSummary, now: Date): VerificationCheck[] {
  const nowMs = now.getTime();
  const issued =
    summary.issuedAt === undefined
      ? check("issued", "fail", "issued-missing")
      : Date.parse(summary.issuedAt) > nowMs + CLOCK_SKEW_MS
        ? check("issued", "fail", "issued-in-future", summary.issuedAt)
        : check("issued", "pass", "issued-ok", summary.issuedAt);
  const expiry =
    summary.expiresAt === undefined
      ? check("expiry", "pass", "no-expiry")
      : Date.parse(summary.expiresAt) <= nowMs
        ? check("expiry", "fail", "expired", summary.expiresAt)
        : check("expiry", "pass", "not-expired", summary.expiresAt);
  return [issued, expiry];
}
