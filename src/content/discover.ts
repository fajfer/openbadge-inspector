// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { MAX_IMAGE_BYTES } from "../extractors/limits.ts";
import type { InspectSource } from "../messaging/messages.ts";

export const MIN_SIZE = 16;
const SVG_MIME = "image/svg+xml";

export type Candidate = HTMLImageElement | SVGSVGElement | HTMLObjectElement | HTMLEmbedElement;

export function discoverCandidates(root: ParentNode): Candidate[] {
  const elements = root.querySelectorAll("img, svg, object, embed");
  return [...elements].filter(isCandidate).filter(isLargeEnough);
}

export function isCandidate(element: Element): element is Candidate {
  if (element instanceof HTMLImageElement) {
    return true;
  }
  if (element instanceof SVGSVGElement) {
    return element.parentElement?.closest("svg") == null;
  }
  if (element instanceof HTMLObjectElement) {
    return isSvgResource(element.type, element.data);
  }
  if (element instanceof HTMLEmbedElement) {
    return isSvgResource(element.type, element.src);
  }
  return false;
}

function isSvgResource(type: string, url: string): boolean {
  return type.startsWith(SVG_MIME) || /\.svgz?($|[?#])/i.test(url);
}

function isLargeEnough(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  if (element instanceof HTMLImageElement && rect.width === 0 && rect.height === 0) {
    return element.naturalWidth >= MIN_SIZE && element.naturalHeight >= MIN_SIZE;
  }
  return rect.width >= MIN_SIZE && rect.height >= MIN_SIZE;
}

export function sourceUrl(element: Candidate): string | undefined {
  if (element instanceof HTMLImageElement) {
    return element.currentSrc || element.src || undefined;
  }
  if (element instanceof HTMLObjectElement) {
    return element.data || undefined;
  }
  if (element instanceof HTMLEmbedElement) {
    return element.src || undefined;
  }
  return undefined;
}

export async function sourceFor(element: Candidate): Promise<InspectSource | undefined> {
  if (element instanceof SVGSVGElement) {
    const text = new XMLSerializer().serializeToString(element);
    return { kind: "inline", mime: SVG_MIME, base64: toBase64(new TextEncoder().encode(text)) };
  }
  const url = sourceUrl(element);
  if (url === undefined) {
    return undefined;
  }
  return (await readInPage(url)) ?? { kind: "url", url };
}

async function readInPage(url: string): Promise<InspectSource | undefined> {
  if (!/^(https?|data|blob):/i.test(url)) {
    return undefined;
  }
  try {
    const response = await fetch(url, { cache: "force-cache", credentials: "same-origin" });
    if (!response.ok) {
      return undefined;
    }
    const declared = Number(response.headers.get("content-length") ?? "0");
    if (declared > MAX_IMAGE_BYTES) {
      return undefined;
    }
    const bytes = copyBytes(await response.arrayBuffer());
    if (bytes.length > MAX_IMAGE_BYTES) {
      return undefined;
    }
    return { kind: "inline", mime: response.headers.get("content-type") ?? "", base64: toBase64(bytes) };
  } catch {
    return undefined;
  }
}

export function describeSource(element: Candidate): string {
  return sourceUrl(element)?.slice(0, 2048) ?? `inline-svg:${element.id || String(element.childElementCount)}`;
}

function copyBytes(buffer: ArrayBuffer): Uint8Array {
  const source = new Uint8Array(buffer);
  const copy = new Uint8Array(source.length);
  for (let index = 0; index < source.length; index += 1) {
    copy[index] = source[index] ?? 0;
  }
  return copy;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}
