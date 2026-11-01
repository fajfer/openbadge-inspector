// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { TabReport } from "../../../src/messaging/messages.ts";
import { clickToolbarButton, inExtension, openExtensionPage, packageExtension, startFirefox } from "../firefox.ts";

const driver = await startFirefox(packageExtension());
const options = await openExtensionPage(driver, "options.html");

for (const url of process.argv.slice(2)) {
  await driver.switchTo().newWindow("tab");
  const page = await driver.getWindowHandle();
  await driver.get(url);
  await driver.sleep(6000);
  await clickToolbarButton(driver);
  await driver.sleep(8000);
  await driver.switchTo().window(options);
  const tabId = await inExtension<number>(
    driver,
    "return Math.max(...(await browser.tabs.query({})).map((tab) => tab.id));",
  );
  const report = await inExtension<TabReport>(
    driver,
    "return await browser.runtime.sendMessage({ type: 'get-tab-report', tabId: args[0] });",
    tabId,
  );
  process.stdout.write(`\n=== ${url}\n`);
  for (const image of report.images) {
    process.stdout.write(`${image.status.padEnd(11)} ${image.source.slice(0, 140)}\n`);
  }
  const unreadable = report.images.filter((image) => image.status === "unreadable").slice(0, 3);
  for (const image of unreadable) {
    await inExtension(
      driver,
      "await browser.tabs.sendMessage(args[0], { type: 'inspect-image', srcUrl: args[1] });",
      tabId,
      image.source,
    );
    await driver.sleep(1500);
    const card = (
      await inExtension<TabReport>(
        driver,
        "return await browser.runtime.sendMessage({ type: 'get-tab-report', tabId: args[0] });",
        tabId,
      )
    ).card;
    process.stdout.write(`  card for ${image.source.slice(0, 80)}: ${card?.text ?? "none"}\n`);
  }
  await driver.switchTo().window(page);
}
await driver.quit();
