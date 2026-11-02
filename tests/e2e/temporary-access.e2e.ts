// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TabReport } from "../../src/messaging/messages.ts";
import { CROSS_ORIGIN_IMAGE } from "../fixtures/gallery.ts";
import { clickToolbarButton } from "./firefox.ts";
import {
  assertStatuses,
  driver,
  clickOption,
  expectedStatuses,
  galleryComplete,
  screenshot,
  message,
  onOptions,
  openGallery,
  PAGE_BASE,
  startSession,
  stopSession,
  waitForReport,
} from "./session.ts";

beforeAll(startSession);
afterAll(stopSession);

describe("without access to all websites", () => {
  it("scans the page when the real toolbar button is clicked", async () => {
    const { handle, tabId } = await openGallery();
    await driver.switchTo().window(handle);
    expect(await clickToolbarButton(driver)).toBe("triggered");
    const report = await waitForReport(tabId, galleryComplete);
    const expected = expectedStatuses();
    expected.set(CROSS_ORIGIN_IMAGE, "unreadable");
    assertStatuses(report, expected);
    await driver.switchTo().window(handle);
    await screenshot("toolbar-without-permissions");
  });

  it("reads same-origin images, as after a toolbar click", async () => {
    await clickOption("reachAllIssuers");
    const { tabId } = await openGallery();
    await message({ type: "inspect-in-tab", tabId, srcUrl: `${PAGE_BASE}/not-on-the-page.png` });
    expect((await message<TabReport>({ type: "get-tab-report", tabId })).images).toEqual([]);
    await clickOption("reachAllIssuers");
    expect(await onOptions<boolean>("return await browser.permissions.contains({ origins: ['<all_urls>'] });")).toBe(
      false,
    );
    await onOptions("await browser.tabs.sendMessage(args[0], { type: 'scan-page' });", tabId);
    const report = await waitForReport(tabId, galleryComplete);
    const expected = expectedStatuses();
    expected.set(CROSS_ORIGIN_IMAGE, "unreadable");
    assertStatuses(report, expected);

    await onOptions(
      "await browser.tabs.sendMessage(args[0], { type: 'inspect-image', srcUrl: args[1], online: true });",
      tabId,
      `${PAGE_BASE}/png/ob2-hosted.png`,
    );
    const blocked = await waitForReport(tabId, (current) => current.card?.text.includes("Verify again") === true);
    expect(blocked.card?.text).toContain("issuer.example doesn't let browser extensions read its badge data.");
    expect(blocked.card?.text).toContain("Allow in settings");
  });
});
