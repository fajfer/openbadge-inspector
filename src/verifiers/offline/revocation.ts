// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { Verifier } from "../../registry/types.ts";
import { check } from "../checks.ts";

export const offlineRevocationVerifier: Verifier = {
  id: "offline-revocation",
  mode: "offline",
  appliesTo: (summary) => summary.spec === "ob2" || summary.document?.credentialStatus !== undefined,
  verify: () => Promise.resolve({ checks: [check("revocation", "not-run", "needs-online")] }),
};
