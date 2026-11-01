// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { HttpClient, HttpJsonResponse } from "../../registry/types.ts";
import { concatBytes, utf8Decode } from "../../shared/bytes.ts";
import { parseJson } from "../../shared/json.ts";

export const ONLINE_TIMEOUT_MS = 10_000;
export const MAX_RESPONSE_BYTES = 1024 * 1024;
const NETWORK_ERROR_STATUS = 0;

export class InsecureUrlError extends Error {}

export function createHttpClient(fetchImpl: typeof fetch = fetch): HttpClient {
  return {
    async getJson(url: string): Promise<HttpJsonResponse> {
      if (!isHttpsUrl(url)) {
        return { status: NETWORK_ERROR_STATUS };
      }
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort();
      }, ONLINE_TIMEOUT_MS);
      try {
        const response = await fetchImpl(url, {
          credentials: "omit",
          redirect: "follow",
          signal: controller.signal,
          headers: { Accept: "application/ld+json, application/json;q=0.9" },
        });
        if (!isHttpsUrl(response.url === "" ? url : response.url)) {
          return { status: NETWORK_ERROR_STATUS };
        }
        const body = await readCapped(response);
        const json = body === undefined ? undefined : parseJson(utf8Decode(body));
        return json === undefined ? { status: response.status } : { status: response.status, json };
      } catch {
        return { status: NETWORK_ERROR_STATUS };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

async function readCapped(response: Response): Promise<Uint8Array | undefined> {
  if (response.body === null) {
    return undefined;
  }
  const reader = response.body.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        return concatBytes(...parts);
      }
      total += value.length;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return undefined;
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}
