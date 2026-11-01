// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { JsonObject } from "../shared/json.ts";
import type { CompactJws } from "../shared/jws.ts";

export interface ImageInput {
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly mimeHint?: string;
}

export type PayloadContainer = "png-itxt" | "svg-assertion" | "svg-credential";
export type PayloadEncoding = "url" | "json" | "compact-jws" | "unknown";

export interface RawPayload {
  readonly container: PayloadContainer;
  readonly encoding: PayloadEncoding;
  readonly text: string;
}

export type ExtractErrorReason = "image-corrupt" | "image-too-large" | "payload-too-large";

export type ExtractResult =
  | { readonly kind: "baked"; readonly payloads: readonly RawPayload[] }
  | { readonly kind: "not-baked" }
  | { readonly kind: "error"; readonly reason: ExtractErrorReason };

export interface Extractor {
  readonly id: string;
  accepts(input: ImageInput): boolean;
  extract(input: ImageInput): Promise<ExtractResult>;
}

export type SpecVersion = "ob2" | "ob3" | "unknown";
export type ProofFormat = "hosted" | "ob2-jws" | "data-integrity" | "vc-jwt" | "none";

export interface IssuerSummary {
  readonly id?: string;
  readonly name?: string;
  readonly url?: string;
}

export interface RecipientSummary {
  readonly type?: string;
  readonly hashed?: boolean;
}

export interface BadgeSummary {
  readonly spec: SpecVersion;
  readonly proofFormat: ProofFormat;
  readonly name?: string;
  readonly description?: string;
  readonly issuer: IssuerSummary;
  readonly issuedAt?: string;
  readonly expiresAt?: string;
  readonly recipient: RecipientSummary;
  readonly hostedUrl?: string;
  readonly badgeClassUrl?: string;
  readonly issuerUrl?: string;
  readonly document?: JsonObject;
  readonly jws?: CompactJws;
  readonly schemaIssues: readonly string[];
}

export interface FormatParser {
  readonly id: SpecVersion;
  accepts(payload: RawPayload): boolean;
  parse(payload: RawPayload): BadgeSummary;
}

export type CheckId = "schema" | "authenticity" | "revocation" | "issued" | "expiry";
export type CheckStatus = "pass" | "fail" | "not-run";

export type CheckReason =
  | "schema-valid"
  | "schema-invalid"
  | "signature-valid"
  | "signature-invalid"
  | "hosted-match"
  | "hosted-mismatch"
  | "hosted-unreachable"
  | "needs-online"
  | "key-unresolved"
  | "unsupported-algorithm"
  | "unknown-context"
  | "canonicalisation-limit"
  | "not-revoked"
  | "revoked"
  | "status-unreachable"
  | "issued-ok"
  | "issued-in-future"
  | "issued-missing"
  | "not-expired"
  | "no-expiry"
  | "expired";

export interface VerificationCheck {
  readonly id: CheckId;
  readonly status: CheckStatus;
  readonly reason: CheckReason;
  readonly detail?: string;
}

export interface HttpJsonResponse {
  readonly status: number;
  readonly json?: unknown;
}

export interface HttpClient {
  getJson(url: string): Promise<HttpJsonResponse>;
}

export type VerificationMode = "offline" | "online";

export interface InspectionContext {
  readonly now: Date;
  readonly mode: VerificationMode;
  readonly http?: HttpClient;
}

export interface VerifierOutput {
  readonly checks: readonly VerificationCheck[];
  readonly summaryPatch?: Partial<BadgeSummary>;
}

export interface Verifier {
  readonly id: string;
  readonly mode: VerificationMode;
  appliesTo(summary: BadgeSummary): boolean;
  verify(summary: BadgeSummary, context: InspectionContext): Promise<VerifierOutput>;
}

export type BadgeStatus = "verified" | "unverified" | "expired" | "invalid" | "not-baked" | "unreadable";

export type UnreadableReason = ExtractErrorReason | "fetch-failed" | "needs-permission" | "unsupported-source";

export interface InspectionResult {
  readonly status: BadgeStatus;
  readonly badge?: BadgeSummary;
  readonly checks: readonly VerificationCheck[];
  readonly unreadableReason?: UnreadableReason;
  readonly payloadCount: number;
  readonly onlineAvailable: boolean;
  readonly mode: VerificationMode;
}
