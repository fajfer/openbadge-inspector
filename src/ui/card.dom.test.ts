// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, it, vi } from "vitest";
import type { BadgeSummary, InspectionResult } from "../registry/types.ts";
import type { Translate } from "../shared/i18n.ts";
import { renderCard } from "./card.ts";

const t: Translate = (key, substitutions) => (substitutions === undefined ? key : `${key}(${substitutions.join("|")})`);

const actions = { onVerifyOnline: vi.fn(), onOpenSettings: vi.fn(), onClose: vi.fn() };

const badge: BadgeSummary = {
  spec: "ob3",
  proofFormat: "data-integrity",
  name: "<img src=x onerror=alert(1)>",
  description: "Desc",
  issuer: { name: "Uni", url: "javascript:alert(1)" },
  issuedAt: "2026-01-15T10:00:00.000Z",
  recipient: { type: "emailAddress", hashed: true },
  schemaIssues: [],
};

const verified: InspectionResult = {
  status: "verified",
  badge,
  checks: [{ id: "authenticity", status: "pass", reason: "signature-valid" }],
  payloadCount: 1,
  onlineAvailable: false,
  mode: "offline",
};

function render(result: InspectionResult): HTMLElement {
  return renderCard({ result, verifying: false }, actions, t);
}

describe("renderCard", () => {
  it("renders badge text as text, never as HTML", () => {
    const card = render(verified);
    expect(card.querySelector("img")).toBeNull();
    expect(card.querySelector(".badge-name")?.textContent).toBe("<img src=x onerror=alert(1)>");
  });

  it("does not link non-https issuer URLs", () => {
    expect(render(verified).querySelector("a")).toBeNull();
    const https = render({
      ...verified,
      badge: { ...badge, issuer: { name: "Uni", url: "https://u.example" } },
    });
    expect(https.querySelector("a")?.getAttribute("href")).toBe("https://u.example/");
    expect(https.querySelector("a")?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("shows only the fixed explanation for images without badge data", () => {
    const card = render({ ...verified, status: "not-baked", checks: [] });
    expect(card.querySelector(".explanation")?.textContent).toBe("notBakedExplanation");
    expect(card.querySelector(".fields")).toBeNull();
  });

  it("explains a missing permission with the image origin", () => {
    const card = renderCard(
      {
        result: { ...verified, status: "unreadable", unreadableReason: "needs-permission" },
        sourceOrigin: "https://cdn.example",
        verifying: false,
      },
      actions,
      t,
    );
    expect(card.textContent).toContain("unreadableNeedsPermission(https://cdn.example)");
  });

  it("shows the expiry banner for expired badges", () => {
    const card = render({
      ...verified,
      status: "expired",
      badge: { ...badge, expiresAt: "2025-01-01T00:00:00.000Z" },
    });
    expect(card.querySelector(".expired-banner")?.textContent).toMatch(/^expiredOn\(/);
    expect(card.classList.contains("tone-expired")).toBe(true);
  });

  it("always offers the online check when one applies", () => {
    const card = render({ ...verified, onlineAvailable: true });
    const button = card.querySelector<HTMLButtonElement>("button.primary");
    expect(button?.textContent).toBe("buttonVerifyOnline");
    button?.click();
    expect(actions.onVerifyOnline).toHaveBeenCalled();
  });

  it("offers no online check when none applies", () => {
    expect(render(verified).querySelector("button.primary")).toBeNull();
  });

  it("confirms a completed online check", () => {
    const card = render({ ...verified, onlineAvailable: true, mode: "online" });
    expect(card.querySelector(".online-done")?.textContent).toBe("onlineChecked");
    expect(card.querySelector("button.primary")).toBeNull();
  });

  it("explains a blocking issuer and offers the settings and a retry", () => {
    const card = render({
      ...verified,
      onlineAvailable: true,
      mode: "online",
      blockedOrigins: ["https://api.credly.com"],
    });
    expect(card.textContent).toContain("onlineBlocked(api.credly.com)");
    expect(card.querySelector("button.primary")?.textContent).toBe("buttonVerifyAgain");
    card.querySelector<HTMLButtonElement>("button.secondary")?.click();
    expect(actions.onOpenSettings).toHaveBeenCalled();
  });

  it("is an accessible dialog", () => {
    const card = render(verified);
    expect(card.getAttribute("role")).toBe("dialog");
    expect(card.getAttribute("aria-labelledby")).toBe(card.querySelector("h2")?.id);
  });
});
