// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { ContentRequest, TabReport } from "../messaging/messages.ts";

const CONTENT_SCRIPT = "content.js";
const reports = new Map<number, TabReport>();
const BADGE_STATUSES = new Set(["verified", "unverified", "expired", "invalid"]);

export async function runInTab(tabId: number, request: ContentRequest): Promise<void> {
  await browser.scripting.executeScript({ target: { tabId }, files: [CONTENT_SCRIPT] });
  await browser.tabs.sendMessage(tabId, request);
}

export function storeImages(tabId: number, images: TabReport["images"]): void {
  reports.set(tabId, { ...reports.get(tabId), images });
  const found = images.filter((image) => BADGE_STATUSES.has(image.status)).length;
  void browser.action.setBadgeText({ tabId, text: found === 0 ? "" : String(found) });
  void browser.action.setBadgeBackgroundColor({ tabId, color: "#0969da" });
}

export function storeCard(tabId: number, card: NonNullable<TabReport["card"]>): void {
  reports.set(tabId, { images: reports.get(tabId)?.images ?? [], card });
}

export function reportFor(tabId: number): TabReport {
  return reports.get(tabId) ?? { images: [] };
}

export function forgetTab(tabId: number): void {
  reports.delete(tabId);
}
