// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TabReport } from "../../src/messaging/messages.ts";
import {
  assertGallery,
  clickOption,
  driver,
  galleryComplete,
  images,
  inspect,
  message,
  NOT_BAKED_TEXT,
  PAGE_BASE,
  onOptions,
  openGallery,
  screenshot,
  startSession,
  stopSession,
  waitForReport,
} from "./session.ts";

beforeAll(startSession);
afterAll(stopSession);

describe("OpenBadge Inspector in Firefox", () => {
  it("starts with everything off, asks for access only when a setting needs it and gives it back", async () => {
    const hasAllUrls = () =>
      onOptions<boolean>("return await browser.permissions.contains({ origins: ['<all_urls>'] });");
    const settings = await onOptions<Record<string, boolean>>("return await browser.storage.sync.get(null);");
    expect(settings).toEqual({});
    expect(await hasAllUrls()).toBe(false);
    await clickOption("autoScan");
    expect(await hasAllUrls()).toBe(true);
    await clickOption("autoScan");
    expect(await hasAllUrls()).toBe(false);
    expect(await onOptions<unknown>("return await browser.storage.sync.get('autoScan');")).toEqual({ autoScan: false });
    await clickOption("reachAllIssuers");
    expect(await hasAllUrls()).toBe(true);
  });

  it("does nothing on a page until asked, then marks every image on demand", async () => {
    const { handle, tabId } = await openGallery();
    await driver.sleep(1500);
    expect((await message<TabReport>({ type: "get-tab-report", tabId })).images).toEqual([]);
    await message({ type: "scan-tab", tabId });
    const report = await waitForReport(tabId, galleryComplete);
    assertGallery(report);
    await driver.switchTo().window(handle);
    expect(await driver.getTitle()).toBe("OpenBadge Inspector test gallery");
    await screenshot("scan");
  });

  it("shows the card for verified, expired, unverified and non-badge images", async () => {
    const { handle, tabId } = await openGallery();
    await message({ type: "scan-tab", tabId });
    await waitForReport(tabId, galleryComplete);

    const verified = await inspect(tabId, "png/ob3-rdfc.png");
    expect(verified.status).toBe("verified");
    expect(verified.text).toContain("Open Badges Practitioner");
    expect(verified.text).toContain("Example University");
    expect(verified.text).toContain("The issuer's signature is valid.");
    await driver.switchTo().window(handle);
    await screenshot("card-verified");

    const expired = await inspect(tabId, "png/ob3-expired.png");
    expect(expired.status).toBe("expired");
    expect(expired.text).toContain("Expired on");
    await driver.switchTo().window(handle);
    await screenshot("card-expired");

    const hosted = await inspect(tabId, "png/ob2-hosted.png");
    expect(hosted.status).toBe("unverified");
    expect(hosted.text).toContain("Verify online");

    const tampered = await inspect(tabId, "png/ob3-tampered.png");
    expect(tampered.status).toBe("invalid");

    const plain = await inspect(tabId, "png/plain.png");
    expect(plain.status).toBe("not-baked");
    expect(plain.text).toContain(NOT_BAKED_TEXT);
    await driver.switchTo().window(handle);
    await screenshot("card-not-baked");
  });

  it("closes the card with Escape", async () => {
    const { handle, tabId } = await openGallery();
    await inspect(tabId, "png/ob3-vcjwt.png");
    await driver.switchTo().window(handle);
    const before = await driver.takeScreenshot();
    await driver.actions().sendKeys("").perform();
    await driver.sleep(300);
    expect(await driver.takeScreenshot()).not.toEqual(before);
  });

  it("contacts the issuer only when Verify online is clicked", async () => {
    const { tabId } = await openGallery();
    const hosted = await inspect(tabId, "png/ob2-hosted.png");
    expect(hosted.text).toContain("Verify online");
    expect(hosted.text).not.toContain("Checked with the issuer");
    await message({ type: "inspect-in-tab", tabId, srcUrl: `${PAGE_BASE}/png/ob2-hosted.png`, online: true });
    const checked = await waitForReport(
      tabId,
      (report) => report.card?.text.includes("Checked with the issuer") === true,
    );
    expect(checked.card?.status).toBe("unverified");
    expect(checked.card?.text).toContain("The issuer's copy couldn't be loaded.");
    expect(images.requests.every((path) => path.startsWith("/png/"))).toBe(true);
  });

  it("scans automatically, including images added later, when auto-scan is on", async () => {
    await clickOption("autoScan");
    const { handle, tabId } = await openGallery();
    const report = await waitForReport(tabId, galleryComplete);
    assertGallery(report);
    await driver.switchTo().window(handle);
    await driver.executeScript(
      `const image = document.createElement("img");
       image.src = "../png/ob3-tampered.png?late";
       image.width = 128;
       image.height = 128;
       document.body.prepend(image);`,
    );
    const updated = await waitForReport(tabId, (current) =>
      current.images.some((image) => image.source.endsWith("ob3-tampered.png?late")),
    );
    expect(updated.images.find((image) => image.source.endsWith("?late"))?.status).toBe("invalid");
  });
});
