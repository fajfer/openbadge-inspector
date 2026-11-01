// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FIXTURES } from "./catalog.ts";

export const PAGE_HOST = "127.0.0.1";
export const PAGE_PORT = 8765;
export const IMAGE_HOST = "localhost";
export const IMAGE_PORT = 8766;
export const CROSS_ORIGIN_IMAGE = `http://${IMAGE_HOST}:${String(IMAGE_PORT)}/png/ob3-vcjwt.png`;

const STATUS_LABEL: Readonly<Record<string, string>> = {
  verified: "verified",
  unverified: "not verified",
  expired: "expired",
  invalid: "invalid",
  "not-baked": "not a badge",
  unreadable: "unreadable",
};

function escapeHtml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function figure(image: string, caption: string, expected: string): string {
  return `      <figure>
        ${image}
        <figcaption>${escapeHtml(caption)}<br /><small>Expected: ${escapeHtml(expected)}</small></figcaption>
      </figure>`;
}

export function galleryHtml(): string {
  const fixtureDir = import.meta.dirname;
  const inlineSvg = readFileSync(resolve(fixtureDir, "svg/ob3-jcs.svg"), "utf8").replace(/^<\?xml[^>]*>\s*/, "");
  const dataUrl = `data:image/png;base64,${readFileSync(resolve(fixtureDir, "png/ob3-rdfc.png")).toString("base64")}`;
  const catalogue = FIXTURES.map((fixture) =>
    figure(
      `<img src="../${fixture.file}" alt="${escapeHtml(fixture.title)}" width="128" height="128" />`,
      fixture.title,
      STATUS_LABEL[fixture.offlineStatus] ?? fixture.offlineStatus,
    ),
  ).join("\n");
  return `<!doctype html>
<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>OpenBadge Inspector test gallery</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 24px; max-width: 1100px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
      figure { margin: 0; padding: 12px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
      figcaption { font-size: 13px; margin-top: 8px; }
      .spacer { height: 1600px; }
    </style>
  </head>
  <body>
    <h1>OpenBadge Inspector test gallery</h1>
    <p>Every image below is a generated test badge. Use the toolbar button or right-click an image.</p>
    <h2>Fixture catalogue</h2>
    <div class="grid">
${catalogue}
    </div>
    <h2>Other ways images appear on pages</h2>
    <div class="grid">
${figure(inlineSvg.trim(), "Inline SVG (OB 3.0)", "verified")}
${figure('<object data="../svg/ob2-assertion.svg" type="image/svg+xml" width="128" height="128"></object>', "SVG in <object> (OB 2.0)", "not verified")}
${figure('<picture><source srcset="../png/ob3-vcjwt.png" type="image/png" /><img src="../png/plain.png" alt="Picture element" width="128" height="128" /></picture>', "<picture> choosing a badge", "verified")}
${figure(`<img src="${dataUrl}" alt="Data URL badge" width="128" height="128" />`, "data: URL (OB 3.0)", "verified")}
${figure(`<img src="${CROSS_ORIGIN_IMAGE}" alt="Cross-origin badge" width="128" height="128" />`, "Cross-origin image (OB 3.0 VC-JWT)", "verified")}
    </div>
    <div class="spacer"></div>
    <h2>Lazy-loaded image</h2>
    <div class="grid">
${figure('<img src="../png/ob3-expired.png" loading="lazy" alt="Lazy expired badge" width="128" height="128" />', "Lazy-loaded (OB 3.0, expired)", "expired")}
    </div>
  </body>
</html>
`;
}
