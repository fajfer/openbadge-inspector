// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { BackgroundRequest, InspectSource } from "../messaging/messages.ts";
import type { BadgeStatus, InspectionResult } from "../registry/types.ts";
import type { Translate } from "../shared/i18n.ts";
import type { Settings } from "../settings/settings.schema.ts";
import type { Overlay } from "../ui/overlay.ts";
import { type Candidate, describeSource, discoverCandidates, isCandidate, sourceFor, sourceUrl } from "./discover.ts";

const CONCURRENCY = 4;
const BADGE_STATUSES: ReadonlySet<BadgeStatus> = new Set(["verified", "unverified", "expired", "invalid"]);

export interface ControllerDeps {
  readonly document: Document;
  readonly overlay: Overlay;
  readonly t: Translate;
  inspect(source: InspectSource, online: boolean): Promise<InspectionResult>;
  settings(): Promise<Settings>;
  send(message: BackgroundRequest): void;
  targetElement(targetElementId: number): Element | null;
}

interface Entry {
  source?: InspectSource | undefined;
  result?: InspectionResult;
  verifying: boolean;
}

export interface Controller {
  scanPage(announce: boolean): Promise<void>;
  scanNew(): Promise<void>;
  inspectImage(targetElementId: number | undefined, srcUrl: string | undefined): Promise<void>;
}

export function createController(deps: ControllerDeps): Controller {
  const entries = new Map<Candidate, Entry>();

  const entryFor = (element: Candidate): Entry => {
    const existing = entries.get(element);
    if (existing !== undefined) {
      return existing;
    }
    const entry: Entry = { verifying: false };
    entries.set(element, entry);
    return entry;
  };

  const resolve = async (element: Candidate, online: boolean): Promise<InspectionResult> => {
    const entry = entryFor(element);
    entry.source ??= await sourceFor(element);
    if (entry.source === undefined) {
      entry.result = unreadable("unsupported-source");
      return entry.result;
    }
    try {
      entry.result = await deps.inspect(entry.source, online);
    } catch {
      entry.result = unreadable("fetch-failed");
    }
    return entry.result;
  };

  const mark = async (element: Candidate, result: InspectionResult, fromScan: boolean) => {
    const settings = await deps.settings();
    if (fromScan && result.status === "unreadable") {
      return;
    }
    if (BADGE_STATUSES.has(result.status) || settings.showNotBakedMarkers || !fromScan) {
      deps.overlay.setMarker(element, result.status, () => {
        void openCard(element);
      });
    }
  };

  const report = () => {
    const images = [...entries].flatMap(([element, entry]) =>
      entry.result === undefined ? [] : [{ source: describeSource(element), status: entry.result.status }],
    );
    deps.send({ type: "report", images });
  };

  const showCard = async (element: Candidate | undefined, result: InspectionResult, entry: Entry | undefined) => {
    const settings = await deps.settings();
    const url = element === undefined ? undefined : sourceUrl(element);
    const origin = url === undefined ? undefined : originOf(url);
    const card = deps.overlay.showCard(
      element,
      {
        result,
        onlineEnabled: settings.onlineVerification,
        verifying: entry?.verifying ?? false,
        ...(origin === undefined ? {} : { sourceOrigin: origin }),
      },
      {
        onVerifyOnline: () => {
          if (element !== undefined) {
            void verifyOnline(element);
          }
        },
        onOpenSettings: () => {
          deps.send({ type: "open-options" });
        },
        onClose: () => undefined,
      },
    );
    deps.send({ type: "card-shown", status: result.status, text: card.textContent.slice(0, 10_000) });
  };

  const openCard = async (element: Candidate) => {
    const entry = entryFor(element);
    const result = entry.result ?? (await resolve(element, false));
    await mark(element, result, false);
    await showCard(element, result, entry);
    report();
  };

  const verifyOnline = async (element: Candidate) => {
    const entry = entryFor(element);
    if (entry.result === undefined || entry.verifying) {
      return;
    }
    entry.verifying = true;
    await showCard(element, entry.result, entry);
    const result = await resolve(element, true);
    entry.verifying = false;
    await mark(element, result, false);
    if (deps.overlay.cardTarget() === element) {
      await showCard(element, result, entry);
    }
    report();
  };

  const scan = async (elements: readonly Candidate[]) => {
    const queue = [...elements];
    const worker = async () => {
      for (let element = queue.shift(); element !== undefined; element = queue.shift()) {
        const result = await resolve(element, false);
        await mark(element, result, true);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    report();
  };

  return {
    async scanPage(announce) {
      const candidates = discoverCandidates(deps.document);
      if (announce) {
        deps.overlay.showToast(deps.t("scanInProgress"));
      }
      await scan(candidates.filter((element) => entries.get(element)?.result === undefined));
      if (announce) {
        const found = [...entries.values()].filter(
          (entry) => entry.result !== undefined && BADGE_STATUSES.has(entry.result.status),
        ).length;
        const count = String(entries.size);
        deps.overlay.showToast(
          found === 0
            ? deps.t("scanSummaryNone", [count])
            : found === 1
              ? deps.t("scanSummaryOne", [count])
              : deps.t("scanSummaryFound", [String(found), count]),
        );
      }
    },
    async scanNew() {
      await scan(discoverCandidates(deps.document).filter((element) => !entries.has(element)));
    },
    async inspectImage(targetElementId, srcUrl) {
      const target = targetElementId === undefined ? null : deps.targetElement(targetElementId);
      const element =
        target !== null && isCandidate(target)
          ? target
          : discoverCandidates(deps.document).find((candidate) => sourceUrl(candidate) === srcUrl);
      if (element !== undefined) {
        await openCard(element);
        return;
      }
      if (srcUrl !== undefined) {
        const result = await deps.inspect({ kind: "url", url: srcUrl }, false);
        await showCard(undefined, result, undefined);
      }
    },
  };
}

function unreadable(reason: "unsupported-source" | "fetch-failed"): InspectionResult {
  return {
    status: "unreadable",
    unreadableReason: reason,
    checks: [],
    payloadCount: 0,
    onlineAvailable: false,
    mode: "offline",
  };
}

function originOf(url: string): string | undefined {
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}
