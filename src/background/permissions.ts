// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { originPattern } from "./fetch-image.ts";

export function requestImageOrigin(srcUrl: string | undefined, tabUrl: string | undefined): Promise<boolean> {
  if (srcUrl === undefined) {
    return Promise.resolve(true);
  }
  let image: URL;
  try {
    image = new URL(srcUrl);
  } catch {
    return Promise.resolve(true);
  }
  if (!["http:", "https:"].includes(image.protocol) || sameOrigin(image, tabUrl)) {
    return Promise.resolve(true);
  }
  return browser.permissions.request({ origins: [originPattern(image)] }).catch(() => false);
}

function sameOrigin(url: URL, other: string | undefined): boolean {
  try {
    return other !== undefined && new URL(other).origin === url.origin;
  } catch {
    return false;
  }
}
