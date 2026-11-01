// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { CheckId, CheckReason, CheckStatus, VerificationCheck } from "../registry/types.ts";

export function check(id: CheckId, status: CheckStatus, reason: CheckReason, detail?: string): VerificationCheck {
  return detail === undefined ? { id, status, reason } : { id, status, reason, detail };
}
