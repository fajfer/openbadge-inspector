// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { PayloadEncoding } from "../registry/types.ts";
import { COMPACT_JWS_PATTERN } from "../shared/jws.ts";

export function classifyPayload(text: string): PayloadEncoding {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return "json";
  }
  if (/^https?:\/\/\S+$/.test(trimmed)) {
    return "url";
  }
  if (COMPACT_JWS_PATTERN.test(trimmed)) {
    return "compact-jws";
  }
  return "unknown";
}
