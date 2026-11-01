// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, it } from "vitest";
import { fixtureInput, fixtureText } from "../../tests/fixtures/load.ts";
import { utf8Encode } from "../shared/bytes.ts";
import { svgExtractor } from "./svg.ts";

describe("svgExtractor", () => {
  it("sniffs SVG with or without an XML declaration", () => {
    expect(svgExtractor.accepts({ bytes: utf8Encode('<svg xmlns="http://www.w3.org/2000/svg"/>') })).toBe(true);
    expect(svgExtractor.accepts({ bytes: utf8Encode('<?xml version="1.0"?>\n<svg>') })).toBe(true);
    expect(svgExtractor.accepts({ bytes: utf8Encode("<html><svg>") })).toBe(false);
  });

  it("reads an OB 2.0 assertion with CDATA content", async () => {
    const result = await svgExtractor.extract(fixtureInput("svg/ob2-assertion.svg"));
    expect(result).toMatchObject({ kind: "baked", payloads: [{ container: "svg-assertion", encoding: "json" }] });
  });

  it("falls back to the verify attribute", async () => {
    const result = await svgExtractor.extract(fixtureInput("svg/ob2-verify-url.svg"));
    expect(result).toEqual({
      kind: "baked",
      payloads: [{ container: "svg-assertion", encoding: "url", text: "https://issuer.example/assertions/1001.json" }],
    });
  });

  it("reads an inline SVG after it was parsed as HTML and serialised", async () => {
    const html = new DOMParser().parseFromString(
      `<!doctype html><body>${fixtureText("svg/ob3-jcs.svg").replace(/^<\?xml[^>]*>/, "")}</body>`,
      "text/html",
    );
    const svg = html.querySelector("svg");
    expect(svg).not.toBeNull();
    const serialised = new XMLSerializer().serializeToString(svg as SVGSVGElement);
    const result = await svgExtractor.extract({ bytes: utf8Encode(serialised), mimeHint: "image/svg+xml" });
    expect(result).toMatchObject({ kind: "baked", payloads: [{ container: "svg-credential", encoding: "json" }] });
  });

  it("reports unparsable SVG", async () => {
    const result = await svgExtractor.extract({ bytes: utf8Encode("<svg><g></svg>"), mimeHint: "image/svg+xml" });
    expect(result).toEqual({ kind: "error", reason: "image-corrupt" });
  });

  it("returns not-baked for a plain SVG", async () => {
    expect(await svgExtractor.extract(fixtureInput("svg/plain.svg"))).toEqual({ kind: "not-baked" });
  });
});
