// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { parseSettings, type Settings, SETTINGS_KEYS } from "./settings.schema.ts";

export const ALL_URLS = "<all_urls>";

export async function getSettings(): Promise<Settings> {
  return parseSettings(await browser.storage.sync.get(SETTINGS_KEYS));
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  await browser.storage.sync.set(patch);
  return getSettings();
}

export function hasAllUrls(): Promise<boolean> {
  return browser.permissions.contains({ origins: [ALL_URLS] });
}
