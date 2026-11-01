// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import jsonld from "jsonld";
import { canonicalizeJson } from "../../shared/jcs.ts";
import type { JsonObject } from "../../shared/json.ts";
import { createDocumentLoader, type DocumentLoader, UnknownContextError } from "../contexts/loader.ts";

export const CANONICALISATION_TIMEOUT_MS = 5000;

export type Canonicalizer = (document: JsonObject) => Promise<string>;

export class CanonicalisationLimitError extends Error {}

export function jcsCanonicalizer(): Canonicalizer {
  return (document) => Promise.resolve(canonicalizeJson(document));
}

export function rdfcCanonicalizer(loader: DocumentLoader = createDocumentLoader()): Canonicalizer {
  return async (document) => {
    let unknownContext: UnknownContextError | undefined;
    const trackingLoader: DocumentLoader = async (url) => {
      try {
        return await loader(url);
      } catch (error) {
        if (error instanceof UnknownContextError) {
          unknownContext = error;
        }
        throw error;
      }
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new CanonicalisationLimitError("timeout"));
      }, CANONICALISATION_TIMEOUT_MS);
    });
    try {
      const canonize: Promise<string> = jsonld.canonize(document, {
        algorithm: "RDFC-1.0",
        format: "application/n-quads",
        safe: true,
        documentLoader: trackingLoader as unknown as jsonld.Options.DocLoader["documentLoader"],
      } as unknown as jsonld.Options.Normalize);
      return await Promise.race([canonize, timeout]);
    } catch (error) {
      if (unknownContext !== undefined) {
        throw unknownContext;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };
}
