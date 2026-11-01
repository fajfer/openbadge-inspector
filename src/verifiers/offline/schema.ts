// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { Verifier } from "../../registry/types.ts";
import { check } from "../checks.ts";

export const schemaVerifier: Verifier = {
  id: "schema",
  mode: "offline",
  appliesTo: (summary) => summary.document !== undefined || summary.spec === "unknown",
  verify: (summary) =>
    Promise.resolve({
      checks: [
        summary.schemaIssues.length === 0
          ? check("schema", "pass", "schema-valid")
          : check("schema", "fail", "schema-invalid", summary.schemaIssues.join("; ")),
      ],
    }),
};
