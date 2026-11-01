// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { ExtractResult, Extractor, ImageInput, RawPayload } from "../registry/types.ts";
import { byteStream, concatBytes, latin1Decode, startsWithBytes, utf8Decode } from "../shared/bytes.ts";
import { classifyPayload } from "./classify.ts";
import { crc32 } from "./crc32.ts";
import { MAX_IMAGE_BYTES, MAX_PAYLOAD_BYTES, OPEN_BADGES_KEYWORD } from "./limits.ts";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const CHUNK_HEADER_LENGTH = 8;
const CHUNK_CRC_LENGTH = 4;

interface PngChunk {
  readonly type: string;
  readonly data: Uint8Array<ArrayBuffer>;
}

class PngCorruptError extends Error {}
class PayloadTooLargeError extends Error {}

export const pngItxtExtractor: Extractor = {
  id: "png-itxt",
  accepts: (input: ImageInput) => startsWithBytes(input.bytes, PNG_SIGNATURE),
  extract: extractFromPng,
};

async function extractFromPng(input: ImageInput): Promise<ExtractResult> {
  if (input.bytes.length > MAX_IMAGE_BYTES) {
    return { kind: "error", reason: "image-too-large" };
  }
  try {
    const payloads: RawPayload[] = [];
    for (const chunk of readChunks(input.bytes)) {
      if (chunk.type === "iTXt") {
        const text = await readOpenBadgesText(chunk.data);
        if (text !== undefined) {
          payloads.push({ container: "png-itxt", encoding: classifyPayload(text), text });
        }
      }
    }
    return payloads.length > 0 ? { kind: "baked", payloads } : { kind: "not-baked" };
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return { kind: "error", reason: "payload-too-large" };
    }
    if (error instanceof PngCorruptError) {
      return { kind: "error", reason: "image-corrupt" };
    }
    throw error;
  }
}

function* readChunks(bytes: Uint8Array<ArrayBuffer>): Generator<PngChunk> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = PNG_SIGNATURE.length;
  while (offset + CHUNK_HEADER_LENGTH + CHUNK_CRC_LENGTH <= bytes.length) {
    const length = view.getUint32(offset);
    const typeStart = offset + 4;
    const dataStart = typeStart + 4;
    const dataEnd = dataStart + length;
    if (dataEnd + CHUNK_CRC_LENGTH > bytes.length) {
      throw new PngCorruptError("chunk exceeds file");
    }
    const typeAndData = bytes.subarray(typeStart, dataEnd);
    if (crc32(typeAndData) !== view.getUint32(dataEnd)) {
      throw new PngCorruptError("crc mismatch");
    }
    const type = latin1Decode(bytes.subarray(typeStart, dataStart));
    if (type === "IEND") {
      return;
    }
    yield { type, data: bytes.subarray(dataStart, dataEnd) };
    offset = dataEnd + CHUNK_CRC_LENGTH;
  }
  throw new PngCorruptError("missing IEND");
}

async function readOpenBadgesText(data: Uint8Array<ArrayBuffer>): Promise<string | undefined> {
  const keywordEnd = data.indexOf(0);
  if (keywordEnd < 0 || latin1Decode(data.subarray(0, keywordEnd)) !== OPEN_BADGES_KEYWORD) {
    return undefined;
  }
  const compressed = data[keywordEnd + 1] === 1;
  const languageEnd = data.indexOf(0, keywordEnd + 3);
  const translatedEnd = languageEnd < 0 ? -1 : data.indexOf(0, languageEnd + 1);
  if (translatedEnd < 0) {
    throw new PngCorruptError("malformed iTXt");
  }
  const text = data.subarray(translatedEnd + 1);
  if (text.length > MAX_PAYLOAD_BYTES) {
    throw new PayloadTooLargeError("payload too large");
  }
  return utf8Decode(compressed ? await inflate(text) : text);
}

async function inflate(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = byteStream(bytes).pipeThrough(new DecompressionStream("deflate"));
  const reader = stream.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      total += value.length;
      if (total > MAX_PAYLOAD_BYTES) {
        throw new PayloadTooLargeError("inflated payload too large");
      }
      parts.push(value);
    }
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      throw error;
    }
    throw new PngCorruptError("inflate failed");
  } finally {
    reader.releaseLock();
  }
  return concatBytes(...parts);
}
