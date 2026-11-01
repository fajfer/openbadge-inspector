// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { pngExtractor } from "../extractors/png.ts";
import { svgExtractor } from "../extractors/svg.ts";
import { ob2Format } from "../formats/ob2/parse.ts";
import { ob3Format } from "../formats/ob3/parse.ts";
import { offlineAuthenticityVerifier } from "../verifiers/offline/authenticity.ts";
import { datesVerifier } from "../verifiers/offline/dates.ts";
import { offlineRevocationVerifier } from "../verifiers/offline/revocation.ts";
import { schemaVerifier } from "../verifiers/offline/schema.ts";
import { ob2HostedVerifier } from "../verifiers/online/ob2-hosted.ts";
import { ob2SignedVerifier } from "../verifiers/online/ob2-signed.ts";
import { ob3AuthenticityVerifier } from "../verifiers/online/ob3-authenticity.ts";
import { ob3StatusVerifier } from "../verifiers/online/ob3-status.ts";
import { createRegistry, type Registry } from "./registry.ts";

export function defaultRegistry(): Registry {
  return createRegistry()
    .registerExtractor(pngExtractor)
    .registerExtractor(svgExtractor)
    .registerFormat(ob3Format)
    .registerFormat(ob2Format)
    .registerVerifier(schemaVerifier)
    .registerVerifier(datesVerifier)
    .registerVerifier(offlineAuthenticityVerifier)
    .registerVerifier(offlineRevocationVerifier)
    .registerVerifier(ob2HostedVerifier)
    .registerVerifier(ob2SignedVerifier)
    .registerVerifier(ob3AuthenticityVerifier)
    .registerVerifier(ob3StatusVerifier)
    .build();
}
