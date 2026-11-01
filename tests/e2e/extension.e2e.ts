// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { By, type WebDriver } from "selenium-webdriver";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TabReport } from "../../src/messaging/messages.ts";
import type { BadgeStatus } from "../../src/registry/types.ts";
import { FIXTURES } from "../fixtures/catalog.ts";
import { CROSS_ORIGIN_IMAGE, IMAGE_HOST, IMAGE_PORT, PAGE_HOST, PAGE_PORT } from "../fixtures/gallery.ts";
import { inExtension, openExtensionPage, packageExtension, startFirefox } from "./firefox.ts";
import { type FixtureServer, serveFixtures } from "./server.ts";

const NOT_BAKED_TEXT =
  "Not an Open Badge: this image contains no Open Badges data. (Badges re-uploaded or resized by some sites lose this data.)";
const PAGE_BASE = `http://${PAGE_HOST}:${String(PAGE_PORT)}`;
const GALLERY_URL = `${PAGE_BASE}/pages/gallery.html`;

let driver: WebDriver;
let optionsHandle: string;
let pages: FixtureServer;
let images: FixtureServer;

async function onOptions<T>(script: string, ...args: unknown[]): Promise<T> {
  await driver.switchTo().window(optionsHandle);
  return inExtension<T>(driver, script, ...args);
}

function message<T>(payload: unknown): Promise<T> {
  return onOptions<T>("return await browser.runtime.sendMessage(args[0]);", payload);
}

async function openGallery(): Promise<{ handle: string; tabId: number }> {
  await driver.switchTo().newWindow("tab");
  const handle = await driver.getWindowHandle();
  await driver.get(GALLERY_URL);
  const tabIds = await onOptions<number[]>(
    "return (await browser.tabs.query({})).filter((tab) => tab.url === args[0]).map((tab) => tab.id);",
    GALLERY_URL,
  );
  const tabId = Math.max(...tabIds);
  if (!Number.isInteger(tabId)) {
    throw new Error("Gallery tab not found");
  }
  return { handle, tabId };
}

async function waitForReport(tabId: number, accept: (report: TabReport) => boolean): Promise<TabReport> {
  let last: TabReport = { images: [] };
  await driver.wait(
    async () => {
      last = await message<TabReport>({ type: "get-tab-report", tabId });
      return accept(last);
    },
    60_000,
    "timed out waiting for the extension report",
  );
  return last;
}

async function clickOption(id: string): Promise<void> {
  await driver.switchTo().window(optionsHandle);
  await driver.findElement(By.id(id)).click();
  await driver.sleep(300);
}

function expectedStatuses(): Map<string, BadgeStatus> {
  const expected = new Map<string, BadgeStatus>(
    FIXTURES.map((fixture) => [`${PAGE_BASE}/${fixture.file}`, fixture.offlineStatus]),
  );
  expected.set(`${PAGE_BASE}/svg/ob2-assertion.svg`, "unverified");
  expected.set(CROSS_ORIGIN_IMAGE, "verified");
  return expected;
}

function assertGallery(report: TabReport): void {
  const expected = expectedStatuses();
  for (const [source, status] of expected) {
    const matches = report.images.filter((image) => image.source === source);
    expect(matches.length, source).toBeGreaterThan(0);
    expect(new Set(matches.map((image) => image.status)), source).toEqual(new Set([status]));
  }
  const inline = report.images.filter((image) => image.source.startsWith("inline-svg:"));
  expect(inline.map((image) => image.status)).toEqual(["verified"]);
  const dataUrls = report.images.filter((image) => image.source.startsWith("data:"));
  expect(dataUrls.map((image) => image.status)).toEqual(["verified"]);
}

const galleryComplete = (report: TabReport) => report.images.length >= FIXTURES.length + 5;

async function screenshot(name: string): Promise<void> {
  const directory = process.env.E2E_SCREENSHOTS;
  if (directory === undefined) {
    return;
  }
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, `${name}.png`), await driver.takeScreenshot(), "base64");
}

async function inspect(tabId: number, file: string): Promise<NonNullable<TabReport["card"]>> {
  const srcUrl = `${PAGE_BASE}/${file}`;
  const before = (await message<TabReport>({ type: "get-tab-report", tabId })).card;
  await message({ type: "inspect-in-tab", tabId, srcUrl });
  const report = await waitForReport(tabId, (current) => current.card !== undefined && current.card !== before);
  if (report.card === undefined) {
    throw new Error("no card");
  }
  return report.card;
}

beforeAll(async () => {
  pages = await serveFixtures(PAGE_HOST, PAGE_PORT);
  images = await serveFixtures(IMAGE_HOST, IMAGE_PORT);
  driver = await startFirefox(packageExtension());
  optionsHandle = await openExtensionPage(driver, "options.html");
});

afterAll(async () => {
  await driver.quit();
  await Promise.all([pages.close(), images.close()]);
});

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
