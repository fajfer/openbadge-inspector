// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, it } from "vitest";
import { discoverCandidates, isCandidate, sourceFor } from "./discover.ts";

function page(html: string): Document {
  const doc = new DOMParser().parseFromString(`<!doctype html><body>${html}</body>`, "text/html");
  for (const element of doc.querySelectorAll("*")) {
    element.getBoundingClientRect = () => ({ width: 64, height: 64 }) as DOMRect;
  }
  return doc;
}

describe("discoverCandidates", () => {
  it("finds images, top-level SVGs and SVG objects only", () => {
    const doc = page(`
      <img src="a.png">
      <svg><svg></svg></svg>
      <object data="b.svg"></object>
      <object data="movie.mp4"></object>
      <embed src="c.svg">
      <canvas></canvas>`);
    expect(discoverCandidates(doc).map((element) => element.tagName.toLowerCase())).toEqual([
      "img",
      "svg",
      "object",
      "embed",
    ]);
  });

  it("skips tiny images", () => {
    const doc = page('<img src="a.png">');
    const image = doc.querySelector("img");
    if (image !== null) {
      image.getBoundingClientRect = () => ({ width: 10, height: 10 }) as DOMRect;
    }
    expect(discoverCandidates(doc)).toEqual([]);
  });

  it("rejects non-image elements", () => {
    expect(isCandidate(document.createElement("div"))).toBe(false);
  });
});

describe("sourceFor", () => {
  it("serialises inline SVG instead of reading it in place", async () => {
    const doc = page('<svg xmlns="http://www.w3.org/2000/svg"><circle r="1"/></svg>');
    const svg = doc.querySelector("svg");
    const source = svg === null ? undefined : await sourceFor(svg);
    expect(source).toMatchObject({ kind: "inline", mime: "image/svg+xml" });
    expect(source?.kind === "inline" ? atob(source.base64) : "").toContain("<circle");
  });

  it("uses the image URL for img elements", async () => {
    const doc = page('<img src="https://example.org/a.png">');
    const image = doc.querySelector("img");
    expect(image === null ? undefined : await sourceFor(image)).toEqual({
      kind: "url",
      url: "https://example.org/a.png",
    });
  });
});
