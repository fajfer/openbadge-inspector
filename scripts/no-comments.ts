// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import ts from "typescript";

export interface CommentViolation {
  readonly line: number;
  readonly text: string;
}

const SPDX_LINE = /^(SPDX-FileCopyrightText|SPDX-License-Identifier): .+$/;

export function findScriptComments(text: string, fileName = "file.ts"): CommentViolation[] {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
  const seen = new Set<number>();
  const ranges: ts.CommentRange[] = [];
  const collect = (found: readonly ts.CommentRange[] | undefined) => {
    for (const range of found ?? []) {
      if (!seen.has(range.pos)) {
        seen.add(range.pos);
        ranges.push(range);
      }
    }
  };
  const visit = (node: ts.Node) => {
    collect(ts.getLeadingCommentRanges(text, node.getFullStart()));
    collect(ts.getTrailingCommentRanges(text, node.getEnd()));
    for (const child of node.getChildren(source)) {
      visit(child);
    }
  };
  visit(source);
  const firstCode = firstTokenStart(source);
  return ranges
    .filter((range) => !(range.end <= firstCode && isHeaderComment(text.slice(range.pos, range.end))))
    .sort((left, right) => left.pos - right.pos)
    .map((range) => ({
      line: source.getLineAndCharacterOfPosition(range.pos).line + 1,
      text: text.slice(range.pos, range.end),
    }));
}

export function findBlockComments(text: string, open: string, close: string): CommentViolation[] {
  const violations: CommentViolation[] = [];
  let index = text.indexOf(open);
  let headerAllowed = true;
  while (index >= 0) {
    const end = text.indexOf(close, index + open.length);
    const comment = text.slice(index, end < 0 ? text.length : end + close.length);
    const isHeader =
      headerAllowed &&
      text
        .slice(0, index)
        .trim()
        .replace(/^<!doctype html>/i, "")
        .trim() === "";
    if (!(isHeader && isHeaderComment(comment))) {
      violations.push({ line: text.slice(0, index).split("\n").length, text: comment });
    }
    headerAllowed = false;
    index = end < 0 ? -1 : text.indexOf(open, end + close.length);
  }
  return violations;
}

function isHeaderComment(comment: string): boolean {
  const lines = comment
    .replace(/^\/\*|\*\/$|^<!--|-->$/g, "")
    .split("\n")
    .map((line) => line.replace(/^\s*(\/\/|\*)?\s?/, "").trim())
    .filter((line) => line.length > 0);
  return lines.every((line) => SPDX_LINE.test(line));
}

function firstTokenStart(source: ts.SourceFile): number {
  const [first] = source.getChildren(source)[0]?.getChildren(source) ?? [];
  return first === undefined ? source.getEnd() : first.getStart(source);
}
