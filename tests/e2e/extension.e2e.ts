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
  it("starts with everything off and asks for access only when a setting needs it", async () => {
    const settings = await onOptions<Record<string, boolean>>("return await browser.storage.sync.get(null);");
    expect(settings).toEqual({});
    expect(await onOptions<boolean>("return await browser.permissions.contains({ origins: ['<all_urls>'] });")).toBe(
      false,
    );
    await clickOption("autoScan");
    await clickOption("autoScan");
    expect(await onOptions<boolean>("return await browser.permissions.contains({ origins: ['<all_urls>'] });")).toBe(
      true,
    );
    expect(await onOptions<unknown>("return await browser.storage.sync.get('autoScan');")).toEqual({ autoScan: false });
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
    expect(hosted.text).toContain("Turn on online verification in the settings");
    expect(hosted.text).not.toContain("Verify online");

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

  it("offers online verification only after it is enabled", async () => {
    await clickOption("onlineVerification");
    const { tabId } = await openGallery();
    const hosted = await inspect(tabId, "png/ob2-hosted.png");
    expect(hosted.text).toContain("Verify online");
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
