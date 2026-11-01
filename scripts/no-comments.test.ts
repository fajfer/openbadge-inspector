// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, it } from "vitest";
import { findBlockComments, findScriptComments } from "./no-comments.ts";

const COPYRIGHT_TAG = ["SPDX", "FileCopyrightText"].join("-");
const LICENSE_TAG = ["SPDX", "License", "Identifier"].join("-");
const HEADER = `// ${COPYRIGHT_TAG}: 2026 Someone\n//\n// ${LICENSE_TAG}: EUPL-1.2\n\n`;

describe("findScriptComments", () => {
  it("allows the SPDX header", () => {
    expect(findScriptComments(`${HEADER}export const a = 1;\n`)).toEqual([]);
  });

  it.each([
    ["line comment", "const a = 1; // explain\n"],
    ["block comment", "/* explain */\nconst a = 1;\n"],
    ["JSDoc", "/** Docs */\nexport function f() {}\n"],
    ["comment inside a function", "function f() {\n  // TODO\n  return 1;\n}\n"],
    ["eslint directive", "// eslint-disable-next-line\nconst a = 1;\n"],
    ["trailing comment at the end of the file", "const a = 1;\n// bye\n"],
  ])("reports a %s", (_, code) => {
    expect(findScriptComments(`${HEADER}${code}`)).toHaveLength(1);
  });

  it("ignores comment markers inside strings, templates and regexes", () => {
    const code = 'const a = "// no";\nconst b = `/* no */`;\nconst c = /\\/\\*/;\nconst d = "http://x";\n';
    expect(findScriptComments(`${HEADER}${code}`)).toEqual([]);
  });

  it("reports a non-SPDX comment in the header position", () => {
    expect(findScriptComments("// Copyright someone\nconst a = 1;\n")).toHaveLength(1);
  });
});

describe("findBlockComments", () => {
  it("allows a leading SPDX block in CSS and HTML", () => {
    expect(findBlockComments(`/*\n * ${LICENSE_TAG}: EUPL-1.2\n */\na{}`, "/*", "*/")).toEqual([]);
    expect(findBlockComments(`<!doctype html>\n<!--\n${LICENSE_TAG}: EUPL-1.2\n-->\n<p>`, "<!--", "-->")).toEqual([]);
  });

  it("reports any other comment", () => {
    expect(findBlockComments("a{}\n/* note */", "/*", "*/")).toEqual([{ line: 2, text: "/* note */" }]);
  });
});
