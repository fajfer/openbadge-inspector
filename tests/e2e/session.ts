// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { By, type WebDriver } from "selenium-webdriver";
import { expect } from "vitest";
import type { TabReport } from "../../src/messaging/messages.ts";
import type { BadgeStatus } from "../../src/registry/types.ts";
import { FIXTURES } from "../fixtures/catalog.ts";
import { CROSS_ORIGIN_IMAGE, IMAGE_HOST, IMAGE_PORT, PAGE_HOST, PAGE_PORT } from "../fixtures/gallery.ts";
import { inExtension, openExtensionPage, packageExtension, startFirefox } from "./firefox.ts";
import { type FixtureServer, serveFixtures } from "./server.ts";

export const NOT_BAKED_TEXT =
  "Not an Open Badge: this image contains no Open Badges data. (Badges re-uploaded or resized by some sites lose this data.)";
export const PAGE_BASE = `http://${PAGE_HOST}:${String(PAGE_PORT)}`;
const GALLERY_URL = `${PAGE_BASE}/pages/gallery.html`;

export let driver: WebDriver;
let optionsHandle: string;
let pages: FixtureServer;
export let images: FixtureServer;

export async function startSession(): Promise<void> {
  pages = await serveFixtures(PAGE_HOST, PAGE_PORT);
  images = await serveFixtures(IMAGE_HOST, IMAGE_PORT);
  driver = await startFirefox(packageExtension());
  optionsHandle = await openExtensionPage(driver, "options.html");
}

export async function stopSession(): Promise<void> {
  await driver.quit();
  await Promise.all([pages.close(), images.close()]);
}

export async function onOptions<T>(script: string, ...args: unknown[]): Promise<T> {
  await driver.switchTo().window(optionsHandle);
  return inExtension<T>(driver, script, ...args);
}

export function message<T>(payload: unknown): Promise<T> {
  return onOptions<T>("return await browser.runtime.sendMessage(args[0]);", payload);
}

export async function openGallery(): Promise<{ handle: string; tabId: number }> {
  await driver.switchTo().newWindow("tab");
  const handle = await driver.getWindowHandle();
  await driver.get(GALLERY_URL);
  const tabIds = await onOptions<number[]>(
    `const tabs = await browser.tabs.query({});
     const matching = tabs.filter((tab) => tab.url === args[0]);
     return (matching.length > 0 ? matching : tabs).map((tab) => tab.id);`,
    GALLERY_URL,
  );
  const tabId = Math.max(...tabIds);
  if (!Number.isInteger(tabId)) {
    throw new Error("Gallery tab not found");
  }
  return { handle, tabId };
}

export async function waitForReport(tabId: number, accept: (report: TabReport) => boolean): Promise<TabReport> {
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

export async function clickOption(id: string): Promise<void> {
  await driver.switchTo().window(optionsHandle);
  await driver.findElement(By.id(id)).click();
  await driver.sleep(300);
}

export function expectedStatuses(): Map<string, BadgeStatus> {
  const expected = new Map<string, BadgeStatus>(
    FIXTURES.map((fixture) => [`${PAGE_BASE}/${fixture.file}`, fixture.offlineStatus]),
  );
  expected.set(`${PAGE_BASE}/svg/ob2-assertion.svg`, "unverified");
  expected.set(CROSS_ORIGIN_IMAGE, "verified");
  return expected;
}

export function assertStatuses(report: TabReport, expected: ReadonlyMap<string, BadgeStatus>): void {
  for (const [source, status] of expected) {
    const statuses = new Set(report.images.filter((image) => image.source === source).map((image) => image.status));
    expect(statuses, source).toEqual(new Set([status]));
  }
  const inline = report.images.filter((image) => image.source.startsWith("inline-svg:"));
  expect(inline.map((image) => image.status)).toEqual(["verified"]);
  const dataUrls = report.images.filter((image) => image.source.startsWith("data:"));
  expect(dataUrls.map((image) => image.status)).toEqual(["verified"]);
}

export function assertGallery(report: TabReport): void {
  assertStatuses(report, expectedStatuses());
}

export const galleryComplete = (report: TabReport) => report.images.length >= FIXTURES.length + 5;

export async function screenshot(name: string): Promise<void> {
  const directory = process.env.E2E_SCREENSHOTS;
  if (directory === undefined) {
    return;
  }
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, `${name}.png`), await driver.takeScreenshot(), "base64");
}

export async function inspect(tabId: number, file: string): Promise<NonNullable<TabReport["card"]>> {
  const srcUrl = `${PAGE_BASE}/${file}`;
  const before = (await message<TabReport>({ type: "get-tab-report", tabId })).card;
  await message({ type: "inspect-in-tab", tabId, srcUrl });
  const report = await waitForReport(tabId, (current) => current.card !== undefined && current.card !== before);
  if (report.card === undefined) {
    throw new Error("no card");
  }
  return report.card;
}
