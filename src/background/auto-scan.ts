// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { getSettings, hasAllUrls } from "../settings/store.ts";

const SCRIPT_ID = "openbadge-inspector-auto-scan";

export async function syncAutoScan(): Promise<void> {
  const [settings, granted, registered] = await Promise.all([
    getSettings(),
    hasAllUrls(),
    browser.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] }),
  ]);
  const wanted = settings.autoScan && granted;
  if (wanted && registered.length === 0) {
    await browser.scripting.registerContentScripts([
      { id: SCRIPT_ID, js: ["content.js"], matches: ["<all_urls>"], runAt: "document_idle" },
    ]);
  } else if (!wanted && registered.length > 0) {
    await browser.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
  }
}
