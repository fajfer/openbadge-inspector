// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import credentialsV1 from "./credentials-v1.json" with { type: "json" };
import credentialsV2 from "./credentials-v2.json" with { type: "json" };
import dataIntegrityV2 from "./data-integrity-v2.json" with { type: "json" };
import multikeyV1 from "./multikey-v1.json" with { type: "json" };
import obV3p0Context from "./ob-v3p0-context.json" with { type: "json" };
import obV3p0Context301 from "./ob-v3p0-3.0.1.json" with { type: "json" };
import obV3p0Context302 from "./ob-v3p0-3.0.2.json" with { type: "json" };
import obV3p0Context303 from "./ob-v3p0-3.0.3.json" with { type: "json" };
import obV3p0Extensions from "./ob-v3p0-extensions.json" with { type: "json" };

export interface RemoteDocument {
  readonly contextUrl: null;
  readonly documentUrl: string;
  readonly document: unknown;
}

export type DocumentLoader = (url: string) => Promise<RemoteDocument>;

export const BUNDLED_CONTEXTS: Readonly<Record<string, unknown>> = {
  "https://www.w3.org/2018/credentials/v1": credentialsV1,
  "https://www.w3.org/ns/credentials/v2": credentialsV2,
  "https://w3id.org/security/data-integrity/v2": dataIntegrityV2,
  "https://w3id.org/security/multikey/v1": multikeyV1,
  "https://purl.imsglobal.org/spec/ob/v3p0/context.json": obV3p0Context,
  "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json": obV3p0Context301,
  "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json": obV3p0Context302,
  "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json": obV3p0Context303,
  "https://purl.imsglobal.org/spec/ob/v3p0/extensions.json": obV3p0Extensions,
};

export class UnknownContextError extends Error {
  readonly url: string;

  constructor(url: string) {
    super(`Context not bundled: ${url}`);
    this.url = url;
  }
}

export function createDocumentLoader(extra: Readonly<Record<string, unknown>> = {}): DocumentLoader {
  return (url) => {
    const document = extra[url] ?? BUNDLED_CONTEXTS[url];
    if (document === undefined) {
      return Promise.reject(new UnknownContextError(url));
    }
    return Promise.resolve({ contextUrl: null, documentUrl: url, document });
  };
}
