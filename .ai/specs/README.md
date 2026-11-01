<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# Specs

A spec is the plan for a task with 3+ steps: the goal, its scope, and a task list. Each task names the exact
files an agent must read (**Load**), so it can be done with only those files.

## Rules

- File name: `YYYY-MM-DD-slug.md`, copied from [TEMPLATE.md](TEMPLATE.md).
- GitHub issues are the backlog. Write a spec when work starts, and put the issue number in its `Issue` field.
- **Load** lists exact paths (scoped `AGENTS.md`, ADRs, specific source files). Nothing outside the list is
  needed; if it is, fix the list.
- Each task row has its own Load (a subset of, or addition to, the spec's Load), a checkable "Done when", a
  Status (`todo`/`doing`/`done`/`dropped`) and, when done, the Commit.
- If a spec changes a decision, it lists the ADRs affected, and a superseding ADR is written as one of its tasks.
- When all tasks are `done` and Validation passes, move the file to [implemented/](implemented/).

## Open

| Spec | Goal |
|---|---|
| [2026-11-01-v1-mvp](2026-11-01-v1-mvp.md) | v1: inspect baked OB 2.0/3.0 PNG and SVG badges on demand, offline-first, AMO-ready |

## Implemented

| Spec | Goal |
|---|---|
