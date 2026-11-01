// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { ExtractResult, Extractor, ImageInput, PayloadContainer, RawPayload } from "../registry/types.ts";
import { utf8Decode } from "../shared/bytes.ts";
import { classifyPayload } from "./classify.ts";
import { MAX_IMAGE_BYTES, MAX_PAYLOAD_BYTES, OPEN_BADGES_NAMESPACE } from "./limits.ts";

const SNIFF_LENGTH = 1024;
const SVG_MIME = "image/svg+xml";

const ELEMENTS: readonly { localName: string; container: PayloadContainer }[] = [
  { localName: "assertion", container: "svg-assertion" },
  { localName: "credential", container: "svg-credential" },
];

export const svgExtractor: Extractor = {
  id: "svg",
  accepts: looksLikeSvg,
  extract: extractFromSvg,
};

function looksLikeSvg(input: ImageInput): boolean {
  if (input.mimeHint?.startsWith(SVG_MIME) === true) {
    return true;
  }
  const head = utf8Decode(input.bytes.subarray(0, SNIFF_LENGTH)).replace(/^\uFEFF/, "");
  return /^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE[^>]*>\s*)?<svg[\s>]/i.test(head);
}

function extractFromSvg(input: ImageInput): Promise<ExtractResult> {
  if (input.bytes.length > MAX_IMAGE_BYTES) {
    return Promise.resolve({ kind: "error", reason: "image-too-large" });
  }
  const document = new DOMParser().parseFromString(utf8Decode(input.bytes), SVG_MIME);
  if (document.getElementsByTagName("parsererror").length > 0) {
    return Promise.resolve({ kind: "error", reason: "image-corrupt" });
  }
  const payloads: RawPayload[] = [];
  for (const { localName, container } of ELEMENTS) {
    for (const element of findOpenBadgesElements(document, localName)) {
      const text = payloadText(element);
      if (text.length > MAX_PAYLOAD_BYTES) {
        return Promise.resolve({ kind: "error", reason: "payload-too-large" });
      }
      if (text.length > 0) {
        payloads.push({ container, encoding: classifyPayload(text), text });
      }
    }
  }
  return Promise.resolve(payloads.length > 0 ? { kind: "baked", payloads } : { kind: "not-baked" });
}

function findOpenBadgesElements(document: Document, localName: string): Element[] {
  const namespaced = [...document.getElementsByTagNameNS(OPEN_BADGES_NAMESPACE, localName)];
  if (namespaced.length > 0) {
    return namespaced;
  }
  return [...document.getElementsByTagName(`openbadges:${localName}`)];
}

function payloadText(element: Element): string {
  const content = element.textContent.trim();
  if (content.length > 0) {
    return content;
  }
  return (element.getAttribute("verify") ?? "").trim();
}
