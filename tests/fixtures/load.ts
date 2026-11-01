// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ImageInput } from "../../src/registry/types.ts";

export function fixtureInput(file: string): ImageInput {
  const bytes = new Uint8Array(readFileSync(resolve(import.meta.dirname, file)));
  return file.endsWith(".svg") ? { bytes, mimeHint: "image/svg+xml" } : { bytes };
}

export function fixtureText(file: string): string {
  return readFileSync(resolve(import.meta.dirname, file), "utf8");
}
