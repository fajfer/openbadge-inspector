// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { BadgeSummary, InspectionResult, VerificationCheck } from "../registry/types.ts";
import { formatDate, type MessageKey, type Translate } from "../shared/i18n.ts";
import { element, safeHttpsUrl, truncate } from "./dom.ts";
import {
  CHECK_LABEL,
  CHECK_STATUS,
  DATED_REASONS,
  REASON_MESSAGE,
  STATUS_APPEARANCE,
  UNREADABLE_MESSAGE,
} from "./status.ts";

const MAX_TEXT = 400;
const MAX_DETAIL = 240;

export interface CardModel {
  readonly result: InspectionResult;
  readonly sourceOrigin?: string;
  readonly verifying: boolean;
}

export interface CardActions {
  readonly onVerifyOnline: () => void;
  readonly onOpenSettings: () => void;
  readonly onClose: () => void;
}

export function renderCard(model: CardModel, actions: CardActions, t: Translate): HTMLElement {
  const { result } = model;
  const appearance = STATUS_APPEARANCE[result.status];
  const title = element("h2", "title", t(appearance.label));
  title.id = "obi-card-title";
  const card = element(
    "section",
    `card tone-${appearance.tone}`,
    element(
      "header",
      "card-header",
      element("span", "badge-symbol", appearance.symbol),
      title,
      closeButton(actions, t),
    ),
  );
  card.setAttribute("role", "dialog");
  card.tabIndex = -1;
  card.setAttribute("aria-labelledby", title.id);
  card.dataset.status = result.status;
  card.append(...bodyFor(model, actions, t));
  return card;
}

function bodyFor(model: CardModel, actions: CardActions, t: Translate): HTMLElement[] {
  const { result } = model;
  if (result.status === "not-baked") {
    return [element("p", "explanation", t("notBakedExplanation"))];
  }
  if (result.status === "unreadable" || result.badge === undefined) {
    const reason = result.unreadableReason ?? "fetch-failed";
    const substitutions = reason === "needs-permission" ? [model.sourceOrigin ?? ""] : undefined;
    return [element("p", "explanation", t(UNREADABLE_MESSAGE[reason], substitutions))];
  }
  const parts: HTMLElement[] = [];
  if (result.status === "expired" && result.badge.expiresAt !== undefined) {
    parts.push(element("p", "expired-banner", t("expiredOn", [formatDate(result.badge.expiresAt) ?? ""])));
  }
  parts.push(...badgeDetails(result.badge, t));
  if (result.payloadCount > 1) {
    parts.push(element("p", "note", t("multiplePayloads", [String(result.payloadCount)])));
  }
  parts.push(checksList(result.checks, t));
  const footer = onlineFooter(model, actions, t);
  if (footer !== undefined) {
    parts.push(footer);
  }
  return parts;
}

function badgeDetails(badge: BadgeSummary, t: Translate): HTMLElement[] {
  const name = element("p", "badge-name", truncate(badge.name ?? t("untitledBadge"), MAX_TEXT));
  const parts: HTMLElement[] = [name];
  if (badge.description !== undefined) {
    parts.push(element("p", "badge-description", truncate(badge.description, MAX_TEXT)));
  } else if (badge.spec === "ob2" && badge.name === undefined) {
    parts.push(element("p", "note", t("badgeDetailsHosted")));
  }
  const list = element("dl", "fields");
  addField(list, t("fieldIssuer"), issuerValue(badge, t));
  addField(list, t("fieldIssued"), formatDate(badge.issuedAt) ?? t("valueNotStated"));
  addField(list, t("fieldExpires"), formatDate(badge.expiresAt) ?? t("valueNever"));
  addField(list, t("fieldStandard"), t(specMessage(badge)));
  addField(list, t("fieldRecipient"), recipientValue(badge, t));
  parts.push(list);
  return parts;
}

function addField(list: HTMLDListElement, label: string, value: Node | string): void {
  list.append(element("dt", undefined, label), element("dd", undefined, value));
}

function issuerValue(badge: BadgeSummary, t: Translate): Node | string {
  const name = truncate(badge.issuer.name ?? badge.issuer.id ?? t("valueNotStated"), MAX_TEXT);
  const url = safeHttpsUrl(badge.issuer.url);
  if (url === undefined) {
    return name;
  }
  const link = element("a", undefined, name);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  const host = element("span", "host", ` (${new URL(url).host})`);
  const wrapper = element("span", undefined, link, host);
  return wrapper;
}

function specMessage(badge: BadgeSummary): MessageKey {
  switch (badge.spec) {
    case "ob2":
      return "specOb2";
    case "ob3":
      return "specOb3";
    case "unknown":
      return "specUnknown";
  }
}

function recipientValue(badge: BadgeSummary, t: Translate): string {
  const type = badge.recipient.type;
  if (type === undefined) {
    return t("valueNotStated");
  }
  return badge.recipient.hashed === true ? t("valueHashed", [type]) : type;
}

function checksList(checks: readonly VerificationCheck[], t: Translate): HTMLElement {
  const list = element("ul", "checks");
  for (const check of checks) {
    const status = CHECK_STATUS[check.status];
    const symbol = element("span", "check-symbol", status.symbol);
    symbol.setAttribute("aria-label", t(status.label));
    const reason = element("span", "check-reason", reasonText(check, t));
    const item = element(
      "li",
      `check check-${check.status}`,
      symbol,
      element("span", "check-label", t(CHECK_LABEL[check.id])),
      reason,
    );
    if (check.detail !== undefined && !DATED_REASONS.has(check.reason)) {
      item.append(element("span", "check-detail", truncate(check.detail, MAX_DETAIL)));
    }
    list.append(item);
  }
  return element("div", "checks-section", element("h3", "checks-heading", t("checksHeading")), list);
}

function reasonText(check: VerificationCheck, t: Translate): string {
  const key = REASON_MESSAGE[check.reason];
  if (DATED_REASONS.has(check.reason)) {
    return t(key, [formatDate(check.detail) ?? check.detail ?? ""]);
  }
  return t(key);
}

function onlineFooter(model: CardModel, actions: CardActions, t: Translate): HTMLElement | undefined {
  const { result } = model;
  const blocked = result.blockedOrigins ?? [];
  if (result.mode === "online" && blocked.length === 0) {
    return element("p", "note online-done", t("onlineChecked"));
  }
  if (!result.onlineAvailable) {
    return undefined;
  }
  const verify = button("primary", t(verifyLabel(model, blocked.length > 0)), actions.onVerifyOnline);
  verify.disabled = model.verifying;
  if (blocked.length === 0) {
    return element("div", "actions", verify);
  }
  const hosts = blocked.map((origin) => hostOf(origin)).join(", ");
  return element(
    "div",
    "blocked",
    element("p", "note", t("onlineBlocked", [hosts])),
    element("div", "actions", button("secondary", t("buttonAllowInSettings"), actions.onOpenSettings), verify),
  );
}

function verifyLabel(model: CardModel, retry: boolean): MessageKey {
  if (model.verifying) {
    return "buttonVerifying";
  }
  return retry ? "buttonVerifyAgain" : "buttonVerifyOnline";
}

function button(className: string, label: string, onClick: () => void): HTMLButtonElement {
  const node = element("button", className, label);
  node.type = "button";
  node.addEventListener("click", onClick);
  return node;
}

function hostOf(origin: string): string {
  try {
    return new URL(origin).host;
  } catch {
    return origin;
  }
}

function closeButton(actions: CardActions, t: Translate): HTMLButtonElement {
  const button = element("button", "close", "×");
  button.type = "button";
  button.setAttribute("aria-label", t("buttonClose"));
  button.addEventListener("click", actions.onClose);
  return button;
}
