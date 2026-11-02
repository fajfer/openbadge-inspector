// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_PAYLOAD_BYTES = 1024 * 1024;
export const OPEN_BADGES_KEYWORD = "openbadges";
export const LENIENT_KEYWORDS: ReadonlySet<string> = new Set([OPEN_BADGES_KEYWORD, "openbadge"]);
export const OPEN_BADGES_NAMESPACE = "http://openbadges.org";
