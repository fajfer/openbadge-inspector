// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { cp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { build, type Plugin } from "vite";

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
  { from: "icons", to: "icons" },
] as const;

const SET_IMMEDIATE_ID = "\0set-immediate-shim";
const SET_IMMEDIATE_SHIM = `globalThis.setImmediate ??= (callback, ...args) => setTimeout(callback, 0, ...args);`;

const SOURCE_PATCHES = [
  {
    file: /node_modules\/zod\/v4\/core\/util\.js$/,
    search: 'new F("");',
    replacement: 'throw new Error("eval disabled");',
  },
] as const;

function noEvalPlugin(): Plugin {
  return {
    name: "openbadge-inspector-no-eval",
    enforce: "pre",
    resolveId(source) {
      return source === "setimmediate" ? SET_IMMEDIATE_ID : null;
    },
    load(id) {
      return id === SET_IMMEDIATE_ID ? SET_IMMEDIATE_SHIM : null;
    },
    transform(code, id) {
      const patch = SOURCE_PATCHES.find((candidate) => candidate.file.test(id));
      if (patch === undefined) {
        return null;
      }
      if (!code.includes(patch.search)) {
        throw new Error(`Expected code to patch not found in ${id}`);
      }
      return code.replace(patch.search, patch.replacement);
    },
  };
}

async function buildEntry(entry: (typeof ENTRIES)[number]): Promise<void> {
  await build({
    root: ROOT,
    configFile: false,
    logLevel: "warn",
    plugins: [noEvalPlugin()],
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
