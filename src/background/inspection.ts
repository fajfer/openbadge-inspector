// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { InspectSource } from "../messaging/messages.ts";
import { defaultRegistry } from "../registry/defaults.ts";
import { inspectImage } from "../registry/inspect.ts";
import type { InspectionResult } from "../registry/types.ts";
import { base64Decode } from "../shared/bytes.ts";
import { createHttpClient, type TrackedHttpClient, trackBlockedOrigins } from "../verifiers/online/http.ts";
import { fetchImage } from "./fetch-image.ts";

const CACHE_LIMIT = 300;
const registry = defaultRegistry();
const http = createHttpClient((input, init) => fetch(input, init));
const cache = new Map<string, InspectionResult>();

export async function inspectSource(
  source: InspectSource,
  online: boolean,
  tabUrl: string | undefined,
): Promise<InspectionResult> {
  const cacheKey = source.kind === "url" && !online ? source.url : undefined;
  const cached = cacheKey === undefined ? undefined : cache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }
  const result = await inspectUncached(source, online, tabUrl);
  if (cacheKey !== undefined && result.status !== "unreadable") {
    remember(cacheKey, result);
  }
  return result;
}

async function inspectUncached(
  source: InspectSource,
  online: boolean,
  tabUrl: string | undefined,
): Promise<InspectionResult> {
  const tracked = trackBlockedOrigins(http, isBlocked);
  const context = online
    ? { now: new Date(), mode: "online" as const, http: tracked }
    : { now: new Date(), mode: "offline" as const };
  if (source.kind === "inline") {
    let bytes: Uint8Array<ArrayBuffer>;
    try {
      bytes = base64Decode(source.base64);
    } catch {
      return unreadable("unsupported-source", context.mode);
    }
    return withBlocked(await inspectImage(registry, { bytes, mimeHint: source.mime }, context), tracked);
  }
  const fetched = await fetchImage(source.url, tabUrl);
  if (!fetched.ok) {
    return unreadable(fetched.reason, context.mode);
  }
  return withBlocked(await inspectImage(registry, { bytes: fetched.bytes, mimeHint: fetched.mime }, context), tracked);
}

function withBlocked(result: InspectionResult, tracked: TrackedHttpClient): InspectionResult {
  const blockedOrigins = tracked.blockedOrigins();
  return blockedOrigins.length === 0 ? result : { ...result, blockedOrigins };
}

async function isBlocked(origin: string): Promise<boolean> {
  return !(await browser.permissions.contains({ origins: [`${origin}/*`] }));
}

function remember(key: string, result: InspectionResult): void {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  cache.set(key, result);
}

function unreadable(reason: InspectionResult["unreadableReason"] & string, mode: InspectionResult["mode"]) {
  return {
    status: "unreadable",
    unreadableReason: reason,
    checks: [],
    payloadCount: 0,
    onlineAvailable: false,
    mode,
  } satisfies InspectionResult;
}
