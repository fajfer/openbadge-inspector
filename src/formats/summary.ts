// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { BadgeSummary } from "../registry/types.ts";

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export function withDefined<T extends object>(base: T, optional: { [K in keyof T]?: T[K] | undefined }): T {
  const result: Mutable<T> = { ...base };
  for (const key of Object.keys(optional) as (keyof T)[]) {
    const value = optional[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export function unrecognisedSummary(issue: string): BadgeSummary {
  return { spec: "unknown", proofFormat: "none", issuer: {}, recipient: {}, schemaIssues: [issue] };
}
