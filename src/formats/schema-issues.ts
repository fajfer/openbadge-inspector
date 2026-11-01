// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { z } from "zod";

const MAX_ISSUES = 5;

export function schemaIssues(result: z.ZodSafeParseResult<unknown>): string[] {
  if (result.success) {
    return [];
  }
  return result.error.issues.slice(0, MAX_ISSUES).map((issue) => {
    const path = issue.path.map(String).join(".");
    return path.length > 0 ? `${path}: ${issue.message}` : issue.message;
  });
}
