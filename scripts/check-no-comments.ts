// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type CommentViolation, findBlockComments, findScriptComments } from "./no-comments.ts";

const ROOT = resolve(import.meta.dirname, "..");
const PATTERNS = ["src/**/*.{ts,mjs,css,html}", "scripts/**/*.ts", "tests/**/*.{ts,html}", "*.{ts,mjs}"];

function violationsFor(file: string, text: string): CommentViolation[] {
  if (file.endsWith(".css")) {
    return findBlockComments(text, "/*", "*/");
  }
  if (file.endsWith(".html")) {
    return findBlockComments(text, "<!--", "-->");
  }
  return findScriptComments(text, file);
}

const files = PATTERNS.flatMap((pattern) => globSync(pattern, { cwd: ROOT, exclude: ["node_modules/**", "dist/**"] }));
let failures = 0;
for (const file of [...new Set(files)].sort()) {
  for (const violation of violationsFor(file, readFileSync(resolve(ROOT, file), "utf8"))) {
    failures += 1;
    process.stderr.write(
      `${file}:${String(violation.line)}: comment not allowed: ${violation.text.split("\n")[0] ?? ""}\n`,
    );
  }
}
if (failures > 0) {
  process.stderr.write(`${String(failures)} comment(s) found. Only the SPDX header is allowed (ADR-002).\n`);
  process.exitCode = 1;
}
