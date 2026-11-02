// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { type BackgroundRequest, backgroundRequestSchema } from "../messaging/messages.ts";
import { translate } from "../shared/i18n.ts";
import { syncAutoScan } from "./auto-scan.ts";
import { inspectSource } from "./inspection.ts";
import { requestImageOrigin } from "./permissions.ts";
import { forgetTab, reportFor, runInTab, storeCard, storeImages } from "./tabs.ts";

const MENU_ID = "inspect-open-badge";

void browser.menus
  .removeAll()
  .then(() => browser.menus.create({ id: MENU_ID, title: translate("menuInspect"), contexts: ["image"] }));

browser.menus.onClicked.addListener((info, tab) => {
  const tabId = tab?.id;
  if (info.menuItemId !== MENU_ID || tabId === undefined) {
    return;
  }
  const permission = requestImageOrigin(info.srcUrl, tab?.url);
  void permission.then(() =>
    runInTab(tabId, {
      type: "inspect-image",
      ...(info.targetElementId === undefined ? {} : { targetElementId: info.targetElementId }),
      ...(info.srcUrl === undefined ? {} : { srcUrl: info.srcUrl }),
    }),
  );
});

browser.action.onClicked.addListener((tab) => {
  if (tab.id !== undefined) {
    void runInTab(tab.id, { type: "scan-page" });
  }
});

browser.tabs.onRemoved.addListener(forgetTab);
browser.storage.onChanged.addListener(() => {
  void syncAutoScan();
});
browser.permissions.onRemoved.addListener(() => {
  void syncAutoScan();
});
void syncAutoScan();

browser.runtime.onMessage.addListener((message: unknown, sender: browser.runtime.MessageSender) => {
  const parsed = backgroundRequestSchema.safeParse(message);
  if (!parsed.success || sender.id !== browser.runtime.id) {
    return undefined;
  }
  return handle(parsed.data, sender);
});

async function handle(request: BackgroundRequest, sender: browser.runtime.MessageSender): Promise<unknown> {
  const tabId = sender.tab?.id;
  switch (request.type) {
    case "inspect":
      return inspectSource(request.source, request.online, sender.tab?.url);
    case "report":
      if (tabId !== undefined) {
        storeImages(tabId, request.images);
      }
      return undefined;
    case "card-shown":
      if (tabId !== undefined) {
        storeCard(tabId, { status: request.status, text: request.text });
      }
      return undefined;
    case "open-options":
      return browser.runtime.openOptionsPage();
    case "scan-tab":
      return fromExtensionPage(sender) ? runInTab(request.tabId, { type: "scan-page" }) : undefined;
    case "inspect-in-tab":
      return fromExtensionPage(sender)
        ? runInTab(request.tabId, { type: "inspect-image", srcUrl: request.srcUrl, online: request.online === true })
        : undefined;
    case "get-tab-report":
      return fromExtensionPage(sender) ? reportFor(request.tabId) : undefined;
  }
}

function fromExtensionPage(sender: browser.runtime.MessageSender): boolean {
  return sender.url?.startsWith(browser.runtime.getURL("")) === true;
}
