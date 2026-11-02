// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { BadgeStatus } from "../../src/registry/types.ts";

export interface FixtureEntry {
  readonly file: string;
  readonly title: string;
  readonly offlineStatus: BadgeStatus;
}

export const FIXTURES: readonly FixtureEntry[] = [
  { file: "png/ob3-rdfc.png", title: "OB 3.0, eddsa-rdfc-2022, did:key", offlineStatus: "verified" },
  { file: "png/ob3-rdfc-compressed.png", title: "OB 3.0, compressed iTXt", offlineStatus: "verified" },
  { file: "png/ob3-vcjwt.png", title: "OB 3.0, VC-JWT, did:key", offlineStatus: "verified" },
  { file: "png/ob3-revocable.png", title: "OB 3.0 with a status list", offlineStatus: "verified" },
  { file: "png/ob3-didweb.png", title: "OB 3.0, key on did:web", offlineStatus: "unverified" },
  { file: "png/ob3-expired.png", title: "OB 3.0, expired", offlineStatus: "expired" },
  { file: "png/ob3-tampered.png", title: "OB 3.0, tampered after signing", offlineStatus: "invalid" },
  { file: "png/ob2-hosted.png", title: "OB 2.0 hosted assertion (embedded)", offlineStatus: "unverified" },
  { file: "png/ob2-hosted-url.png", title: "OB 2.0 hosted URL only", offlineStatus: "unverified" },
  { file: "png/ob2-signed.png", title: "OB 2.0 signed (JWS)", offlineStatus: "unverified" },
  { file: "png/ob2-ztxt-openbadge.png", title: "OB 2.0 in a non-standard zTXt chunk", offlineStatus: "unverified" },
  { file: "png/ob3-text-openbadges.png", title: "OB 3.0 in a non-standard tEXt chunk", offlineStatus: "verified" },
  { file: "png/malformed-json.png", title: "Baked but malformed JSON", offlineStatus: "invalid" },
  { file: "png/ob1-text.png", title: "OB 1.0 tEXt chunk (unsupported)", offlineStatus: "not-baked" },
  { file: "png/plain.png", title: "Plain PNG", offlineStatus: "not-baked" },
  { file: "png/corrupt-crc.png", title: "Corrupt PNG (bad CRC)", offlineStatus: "unreadable" },
  { file: "svg/ob3-jcs.svg", title: "OB 3.0 SVG, eddsa-jcs-2022", offlineStatus: "verified" },
  { file: "svg/ob3-with-script.svg", title: "OB 3.0 SVG with a script element", offlineStatus: "verified" },
  { file: "svg/ob2-assertion.svg", title: "OB 2.0 SVG assertion", offlineStatus: "unverified" },
  { file: "svg/ob2-verify-url.svg", title: "OB 2.0 SVG, verify URL only", offlineStatus: "unverified" },
  { file: "svg/plain.svg", title: "Plain SVG", offlineStatus: "not-baked" },
];
