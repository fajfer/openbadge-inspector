// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { Extractor, FormatParser, Verifier } from "./types.ts";

export interface Registry {
  readonly extractors: readonly Extractor[];
  readonly formats: readonly FormatParser[];
  readonly verifiers: readonly Verifier[];
}

export interface RegistryBuilder {
  registerExtractor(extractor: Extractor): RegistryBuilder;
  registerFormat(format: FormatParser): RegistryBuilder;
  registerVerifier(verifier: Verifier): RegistryBuilder;
  build(): Registry;
}

export function createRegistry(): RegistryBuilder {
  const extractors: Extractor[] = [];
  const formats: FormatParser[] = [];
  const verifiers: Verifier[] = [];
  const builder: RegistryBuilder = {
    registerExtractor(extractor) {
      extractors.push(extractor);
      return builder;
    },
    registerFormat(format) {
      formats.push(format);
      return builder;
    },
    registerVerifier(verifier) {
      verifiers.push(verifier);
      return builder;
    },
    build() {
      return { extractors: [...extractors], formats: [...formats], verifiers: [...verifiers] };
    },
  };
  return builder;
}
