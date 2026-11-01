// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { HttpClient, HttpJsonResponse } from "../../src/registry/types.ts";

export interface FakeHttp extends HttpClient {
  readonly requests: string[];
}

export function fakeHttp(responses: Readonly<Record<string, HttpJsonResponse>>): FakeHttp {
  const requests: string[] = [];
  return {
    requests,
    getJson(url) {
      requests.push(url);
      return Promise.resolve(responses[url] ?? { status: 404 });
    },
  };
}

export function ok(json: unknown): HttpJsonResponse {
  return { status: 200, json };
}
