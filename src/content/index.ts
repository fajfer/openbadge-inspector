// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { contentRequestSchema, type BackgroundRequest } from "../messaging/messages.ts";
import type { InspectionResult } from "../registry/types.ts";
import { translate } from "../shared/i18n.ts";
import { getSettings } from "../settings/store.ts";
import { createOverlay } from "../ui/overlay.ts";
import { createController } from "./controller.ts";
import { observeNewImages } from "./observe.ts";

const INSTANCE_KEY = Symbol.for("openbadge-inspector.content");

function start(): void {
  const overlay = createOverlay(document, translate);
  const send = (message: BackgroundRequest) => {
    void browser.runtime.sendMessage(message).catch(() => undefined);
  };
  const controller = createController({
    document,
    overlay,
    t: translate,
    inspect: (source, online) =>
      browser.runtime.sendMessage({
        type: "inspect",
        source,
        online,
      } satisfies BackgroundRequest) as Promise<InspectionResult>,
    settings: getSettings,
    send,
    targetElement: (id) => browser.menus.getTargetElement(id) as Element | null,
  });

  browser.runtime.onMessage.addListener((message: unknown) => {
    const parsed = contentRequestSchema.safeParse(message);
    if (!parsed.success) {
      return undefined;
    }
    const request = parsed.data;
    return request.type === "scan-page"
      ? controller.scanPage(true)
      : controller.inspectImage(request.targetElementId, request.srcUrl, request.online === true);
  });

  void getSettings().then((settings) => {
    if (settings.autoScan) {
      void controller.scanPage(false);
      observeNewImages(document, () => controller.scanNew());
    }
  });
}

const scope = globalThis as unknown as Record<symbol, boolean>;
if (scope[INSTANCE_KEY] !== true) {
  scope[INSTANCE_KEY] = true;
  start();
}
