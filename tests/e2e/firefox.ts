// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Browser, Builder, type WebDriver } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";

export const EXTENSION_ID = "openbadge-inspector@fajfer.org";
export const EXTENSION_UUID = "0b5e1d6a-7f3c-4d1e-9a52-3c8f4b2e6d10";
export const EXTENSION_BASE = `moz-extension://${EXTENSION_UUID}/`;

const ROOT = resolve(import.meta.dirname, "../..");

export function packageExtension(): string {
  const outDir = mkdtempSync(join(tmpdir(), "obi-e2e-"));
  execFileSync("npx", ["web-ext", "build", "-s", "dist", "-a", outDir, "--overwrite-dest"], {
    cwd: ROOT,
    stdio: "ignore",
  });
  const [archive] = readdirSync(outDir).filter((name) => name.endsWith(".zip"));
  if (archive === undefined) {
    throw new Error("web-ext build produced no archive");
  }
  return join(outDir, archive);
}

export async function startFirefox(archive: string): Promise<WebDriver> {
  const options = new firefox.Options()
    .setPreference("extensions.webextensions.uuids", JSON.stringify({ [EXTENSION_ID]: EXTENSION_UUID }))
    .setPreference("extensions.webextOptionalPermissionPrompts", false)
    .setPreference("browser.shell.checkDefaultBrowser", false);
  if (process.env.E2E_HEADED !== "1") {
    options.addArguments("-headless");
  }
  options.windowSize({ width: 1400, height: 1000 });
  const service = new firefox.ServiceBuilder().addArguments("--allow-system-access");
  const driver = await new Builder()
    .forBrowser(Browser.FIREFOX)
    .setFirefoxOptions(options)
    .setFirefoxService(service)
    .build();
  await (driver as unknown as { installAddon(path: string, temporary: boolean): Promise<string> }).installAddon(
    archive,
    true,
  );
  return driver;
}

export async function inExtension<T>(driver: WebDriver, script: string, ...args: unknown[]): Promise<T> {
  return driver.executeAsyncScript<T>(
    `const done = arguments[arguments.length - 1];
     const args = Array.from(arguments).slice(0, -1);
     (async (...args) => { ${script} })(...args).then(done, (error) => done({ error: String(error) }));`,
    ...args,
  );
}

interface ContextSwitchingDriver {
  setContext(context: string): Promise<void>;
}

export async function openExtensionPage(driver: WebDriver, path: string): Promise<string> {
  const before = new Set(await driver.getAllWindowHandles());
  const contexts = driver as unknown as ContextSwitchingDriver;
  await contexts.setContext(firefox.Context.CHROME);
  await driver.executeScript(
    `const browserWindow = Services.wm.getMostRecentWindow("navigator:browser");
     const tab = browserWindow.gBrowser.addTab(arguments[0], {
       triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
     });
     browserWindow.gBrowser.selectedTab = tab;`,
    `${EXTENSION_BASE}${path}`,
  );
  await contexts.setContext(firefox.Context.CONTENT);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const added = (await driver.getAllWindowHandles()).find((handle) => !before.has(handle));
    if (added !== undefined) {
      await driver.switchTo().window(added);
      await driver.wait(async () => (await driver.getCurrentUrl()).startsWith(EXTENSION_BASE), 10_000);
      return added;
    }
    await driver.sleep(100);
  }
  throw new Error("Extension page did not open");
}
