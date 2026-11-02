// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_PAYLOAD_BYTES = 1024 * 1024;
export const OB2_PNG_KEYWORD = "openbadges";
export const OB3_PNG_KEYWORD = "openbadgecredential";
export const STANDARD_PNG_KEYWORDS: ReadonlySet<string> = new Set([OB2_PNG_KEYWORD, OB3_PNG_KEYWORD]);
export const LENIENT_KEYWORDS: ReadonlySet<string> = new Set([...STANDARD_PNG_KEYWORDS, "openbadge"]);
export const OB2_SVG_NAMESPACE = "http://openbadges.org";
export const OB3_SVG_NAMESPACE = "https://purl.imsglobal.org/ob/v3p0";
export const SVG_NAMESPACES: readonly string[] = [OB2_SVG_NAMESPACE, OB3_SVG_NAMESPACE];
