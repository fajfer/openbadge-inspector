// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { Registry } from "./registry.ts";
import { deriveStatus, mergeChecks } from "./status.ts";
import type {
  BadgeSummary,
  ImageInput,
  InspectionContext,
  InspectionResult,
  RawPayload,
  VerificationCheck,
  Verifier,
} from "./types.ts";

export async function inspectImage(
  registry: Registry,
  input: ImageInput,
  context: InspectionContext,
): Promise<InspectionResult> {
  const extractor = registry.extractors.find((candidate) => candidate.accepts(input));
  if (extractor === undefined) {
    return notBaked(context);
  }
  const extracted = await extractor.extract(input);
  if (extracted.kind === "error") {
    return { ...notBaked(context), status: "unreadable", unreadableReason: extracted.reason };
  }
  const [payload] = extracted.kind === "baked" ? extracted.payloads : [];
  if (payload === undefined) {
    return notBaked(context);
  }
  const verified = await verifyPayload(registry, payload, context);
  return { ...verified, payloadCount: extracted.kind === "baked" ? extracted.payloads.length : 0 };
}

export async function verifyPayload(
  registry: Registry,
  payload: RawPayload,
  context: InspectionContext,
): Promise<InspectionResult> {
  let badge = parsePayload(registry, payload);
  let checks: VerificationCheck[] =
    payload.nonStandard === undefined
      ? []
      : [{ id: "baking", status: "warn", reason: "non-standard-baking", detail: payload.nonStandard }];
  const offline = registry.verifiers.filter((verifier) => verifier.mode === "offline");
  const online = registry.verifiers.filter((verifier) => verifier.mode === "online");
  for (const stage of context.mode === "online" ? [offline, online] : [offline]) {
    const outputs = await runVerifiers(stage, badge, context);
    for (const output of outputs) {
      checks = mergeChecks(checks, output.checks);
      badge = { ...badge, ...output.summaryPatch };
    }
  }
  return {
    status: deriveStatus(checks),
    badge,
    checks,
    payloadCount: 1,
    onlineAvailable: online.some((verifier) => verifier.appliesTo(badge)),
    mode: context.mode,
  };
}

function parsePayload(registry: Registry, payload: RawPayload): BadgeSummary {
  const format = registry.formats.find((candidate) => candidate.accepts(payload));
  if (format !== undefined) {
    return format.parse(payload);
  }
  return {
    spec: "unknown",
    proofFormat: "none",
    issuer: {},
    recipient: {},
    schemaIssues: ["The image contains Open Badges data in a format this extension doesn't recognise."],
  };
}

async function runVerifiers(verifiers: readonly Verifier[], badge: BadgeSummary, context: InspectionContext) {
  const applicable = verifiers.filter((verifier) => verifier.appliesTo(badge));
  return Promise.all(applicable.map((verifier) => verifier.verify(badge, context)));
}

function notBaked(context: InspectionContext): InspectionResult {
  return { status: "not-baked", checks: [], payloadCount: 0, onlineAvailable: false, mode: context.mode };
}
