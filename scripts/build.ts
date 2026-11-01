// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { cp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "vite";

const ROOT = resolve(import.meta.dirname, "..");
const OUT_DIR = resolve(ROOT, "dist");

const ENTRIES = [
  { name: "background", source: "src/background/index.ts" },
  { name: "content", source: "src/content/index.ts" },
  { name: "options", source: "src/settings/options.ts" },
] as const;

const STATIC_FILES = [
  { from: "manifest.json", to: "manifest.json" },
  { from: "_locales", to: "_locales" },
  { from: "src/settings/options.html", to: "options.html" },
  { from: "LICENSE", to: "LICENSE" },
] as const;

async function buildEntry(entry: (typeof ENTRIES)[number]): Promise<void> {
  await build({
    root: ROOT,
    configFile: false,
    logLevel: "warn",
    build: {
      outDir: OUT_DIR,
      emptyOutDir: false,
      minify: false,
      sourcemap: false,
      target: "firefox140",
      lib: {
        entry: resolve(ROOT, entry.source),
        formats: ["iife"],
        name: entry.name,
        fileName: () => `${entry.name}.js`,
      },
    },
  });
}

async function copyStaticFiles(): Promise<void> {
  for (const file of STATIC_FILES) {
    await cp(resolve(ROOT, file.from), resolve(OUT_DIR, file.to), { recursive: true });
  }
}

await rm(OUT_DIR, { recursive: true, force: true });
for (const entry of ENTRIES) {
  await buildEntry(entry);
}
await copyStaticFiles();
