// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { MAX_IMAGE_BYTES } from "../extractors/limits.ts";
import type { UnreadableReason } from "../registry/types.ts";
import { concatBytes } from "../shared/bytes.ts";

export type FetchedImage =
  | { readonly ok: true; readonly bytes: Uint8Array<ArrayBuffer>; readonly mime: string }
  | { readonly ok: false; readonly reason: UnreadableReason };

const FETCHABLE_PROTOCOLS = new Set(["http:", "https:", "data:"]);

export async function fetchImage(url: string, tabUrl: string | undefined): Promise<FetchedImage> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: "unsupported-source" };
  }
  if (!FETCHABLE_PROTOCOLS.has(parsed.protocol)) {
    return { ok: false, reason: "unsupported-source" };
  }
  try {
    const response = await fetch(parsed.href, { credentials: "include", cache: "force-cache" });
    if (!response.ok) {
      return { ok: false, reason: "fetch-failed" };
    }
    const bytes = await readCapped(response);
    if (bytes === undefined) {
      return { ok: false, reason: "image-too-large" };
    }
    return { ok: true, bytes, mime: response.headers.get("content-type") ?? "" };
  } catch {
    return { ok: false, reason: await failureReason(parsed, tabUrl) };
  }
}

async function failureReason(url: URL, tabUrl: string | undefined): Promise<UnreadableReason> {
  if (url.protocol === "data:" || (tabUrl !== undefined && sameOrigin(url, tabUrl))) {
    return "fetch-failed";
  }
  const granted = await browser.permissions.contains({ origins: [originPattern(url)] });
  return granted ? "fetch-failed" : "needs-permission";
}

export function originPattern(url: URL): string {
  return `${url.protocol}//${url.hostname}/*`;
}

function sameOrigin(url: URL, other: string): boolean {
  try {
    return new URL(other).origin === url.origin;
  } catch {
    return false;
  }
}

async function readCapped(response: Response): Promise<Uint8Array<ArrayBuffer> | undefined> {
  if (response.body === null) {
    return new Uint8Array(await response.arrayBuffer());
  }
  const reader = response.body.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return concatBytes(...parts);
    }
    total += value.length;
    if (total > MAX_IMAGE_BYTES) {
      await reader.cancel();
      return undefined;
    }
    parts.push(value);
  }
}
