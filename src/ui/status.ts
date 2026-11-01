// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { BadgeStatus, CheckId, CheckReason, CheckStatus, UnreadableReason } from "../registry/types.ts";
import type { MessageKey } from "../shared/i18n.ts";

export interface StatusAppearance {
  readonly symbol: string;
  readonly tone: string;
  readonly label: MessageKey;
}

export const STATUS_APPEARANCE: Readonly<Record<BadgeStatus, StatusAppearance>> = {
  verified: { symbol: "✓", tone: "verified", label: "statusVerified" },
  unverified: { symbol: "!", tone: "unverified", label: "statusUnverified" },
  expired: { symbol: "◷", tone: "expired", label: "statusExpired" },
  invalid: { symbol: "✕", tone: "invalid", label: "statusInvalid" },
  "not-baked": { symbol: "–", tone: "neutral", label: "statusNotBaked" },
  unreadable: { symbol: "?", tone: "neutral", label: "statusUnreadable" },
};

export const CHECK_LABEL: Readonly<Record<CheckId, MessageKey>> = {
  schema: "checkSchema",
  authenticity: "checkAuthenticity",
  revocation: "checkRevocation",
  issued: "checkIssued",
  expiry: "checkExpiry",
};

export const CHECK_STATUS: Readonly<Record<CheckStatus, { symbol: string; label: MessageKey }>> = {
  pass: { symbol: "✓", label: "checkPass" },
  fail: { symbol: "✕", label: "checkFail" },
  "not-run": { symbol: "○", label: "checkNotRun" },
};

export const REASON_MESSAGE: Readonly<Record<CheckReason, MessageKey>> = {
  "schema-valid": "reasonSchemaValid",
  "schema-invalid": "reasonSchemaInvalid",
  "signature-valid": "reasonSignatureValid",
  "signature-invalid": "reasonSignatureInvalid",
  "hosted-match": "reasonHostedMatch",
  "hosted-mismatch": "reasonHostedMismatch",
  "hosted-unreachable": "reasonHostedUnreachable",
  "needs-online": "reasonNeedsOnline",
  "key-unresolved": "reasonKeyUnresolved",
  "unsupported-algorithm": "reasonUnsupportedAlgorithm",
  "unknown-context": "reasonUnknownContext",
  "canonicalisation-limit": "reasonCanonicalisationLimit",
  "not-revoked": "reasonNotRevoked",
  revoked: "reasonRevoked",
  "status-unreachable": "reasonStatusUnreachable",
  "issued-ok": "reasonIssuedOk",
  "issued-in-future": "reasonIssuedInFuture",
  "issued-missing": "reasonIssuedMissing",
  "not-expired": "reasonNotExpired",
  "no-expiry": "reasonNoExpiry",
  expired: "reasonExpired",
};

export const DATED_REASONS: ReadonlySet<CheckReason> = new Set([
  "issued-ok",
  "issued-in-future",
  "not-expired",
  "expired",
]);

export const UNREADABLE_MESSAGE: Readonly<Record<UnreadableReason, MessageKey>> = {
  "fetch-failed": "unreadableFetchFailed",
  "needs-permission": "unreadableNeedsPermission",
  "image-corrupt": "unreadableImageCorrupt",
  "image-too-large": "unreadableImageTooLarge",
  "payload-too-large": "unreadablePayloadTooLarge",
  "unsupported-source": "unreadableUnsupportedSource",
};
