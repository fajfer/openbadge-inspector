<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# Development Guidelines

OpenBadge Inspector is a Firefox extension. It finds Open Badges 2.0/3.0 baked into PNG and SVG images on a page,
shows what they are, and checks whether they are valid. This file holds the rules for every task, plus a router to
the one or two scoped files a task needs. Read this file, then only what the **Task Router** points to. Module
detail lives next to the code. Decisions live in [.ai/adr](.ai/adr/README.md). The original Q&A behind the design is
[PROMPT.md](PROMPT.md); read it only when an ADR doesn't answer a "why".

## Always

- Put an SPDX header on every new file (`SPDX-FileCopyrightText: <years> Damian Fajfer <damian@fajfer.org>` +
  `SPDX-License-Identifier: EUPL-1.2`), in the comment style of that file type. Files that cannot hold a comment
  (JSON, images, fixtures) get a `<file>.license` sidecar or an entry in `REUSE.toml`
  ([ADR-001](.ai/adr/ADR-001-eupl-and-spdx-headers.md)).
- Update the SPDX year range when it is stale, e.g. `2026` becomes `2026-2027` in 2027.
- Strict TypeScript; no `any`, no non-null `!` assertions on untrusted data. Data that crosses a boundary (baked
  payloads, network responses, messages between extension contexts, storage) is parsed with a Zod schema first.
- Keep functions focused and small; follow existing patterns exactly. Names and types carry the meaning that
  comments would otherwise carry ([ADR-002](.ai/adr/ADR-002-no-code-comments.md)).
- New features require tests; bug fixes require regression tests; cover edge cases, malformed input and errors.
- Keep changes minimal: only modify code related to the task at hand. DRY.
- Start with minimal functionality and verify it works before adding complexity.
- Run the formatter before type checks.
- All user-visible strings go through `browser.i18n` (`_locales/en/messages.json`), never hard-coded
  ([ADR-012](.ai/adr/ADR-012-english-ui-through-i18n.md)).

## Ask First

- Anything that contradicts an Accepted ADR: propose a superseding ADR before changing code.
- Adding a manifest permission or host permission, or changing when one is requested
  ([ADR-007](.ai/adr/ADR-007-mv3-desktop-esr.md)). Every permission is reviewed by AMO and shown to users.
- Any new network request, or any change to when one is made ([ADR-005](.ai/adr/ADR-005-offline-first-verification.md)).
- Adding a runtime dependency. Each one is shipped to users and reviewed by AMO; dev dependencies are fine.
- Detecting anything other than baked PNG/SVG data, e.g. link-only Credly/Badgr badges, CSS backgrounds, iframes
  ([ADR-003](.ai/adr/ADR-003-baked-only-detection.md)).

## Never

- Write comments in code. The SPDX header is the only comment a source file may contain. This includes JSDoc,
  `TODO`, commented-out code and `eslint-disable` explanations
  ([ADR-002](.ai/adr/ADR-002-no-code-comments.md)).
- Insert baked or fetched data into the page as HTML (`innerHTML`, `insertAdjacentHTML`, `outerHTML`), or render an
  SVG from a page as a live document. Use `textContent` and `DOMParser` ([ADR-010](.ai/adr/ADR-010-untrusted-input.md)).
- Contact an issuer, key or DID URL without the setting enabled **and** an explicit user click
  ([ADR-005](.ai/adr/ADR-005-offline-first-verification.md)).
- Collect, store or send personal data, browsing history or telemetry. No analytics.
- Call an image "fake". A non-baked image gets the careful wording from
  [ADR-006](.ai/adr/ADR-006-overlay-card-and-status-icons.md).
- Use `eval`, `new Function`, remote code or a CDN at runtime (AMO policy, MV3 CSP).
- Add a `Co-authored-by:` trailer for an AI assistant (AI assistants are not GitHub users; the convention is
  reserved for human collaborators). Use `Assisted-by:` instead.
- Add deprecation warnings or backward-compatibility shims before 1.0: change the code and its settings directly.
- Swallow errors with an empty `catch`. Catch, map to a typed result (`VerificationCheck` with a reason), or rethrow.
- Merge a PR, push a release tag or submit to AMO without the maintainer's go.

## Validation Commands

| What | Command |
|---|---|
| Format | `npm run format:check` |
| Lint (incl. no-comments check) | `npm run lint` |
| Types | `npm run typecheck` |
| Unit tests (all) | `npm test` |
| Unit tests (one module) | see the **Validate** section of the scoped file |
| E2E (real Firefox) | `npm run test:e2e` |
| Extension lint | `npm run build && npx web-ext lint -s dist` |
| Licensing | `reuse lint` |

These scripts are created by the first task of the [v1 spec](.ai/specs/2026-11-01-v1-mvp.md).

## Task Router

Shorthand: `<area>` means `<area>/AGENTS.md`. Read root + the listed files, nothing else.

| Task | Read |
|---|---|
| Read baked data out of a PNG or SVG file | [extractors](src/extractors/AGENTS.md), [ADR-003](.ai/adr/ADR-003-baked-only-detection.md), [ADR-010](.ai/adr/ADR-010-untrusted-input.md) |
| OB 2.0 / OB 3.0 schema, parsing, `BadgeSummary` | [formats](src/formats/AGENTS.md) |
| Signature, expiry, revocation, hosted check | [verifiers](src/verifiers/AGENTS.md), [ADR-005](.ai/adr/ADR-005-offline-first-verification.md) |
| Add a new extractor, format or verifier | [registry](src/registry/AGENTS.md), [ADR-009](.ai/adr/ADR-009-plugin-registry.md) + the module's file |
| Find images on a page, status icons, lazy images | [content](src/content/AGENTS.md), [ADR-004](.ai/adr/ADR-004-on-demand-scanning.md) |
| Info card look, text or fields | [ui](src/ui/AGENTS.md), [ADR-006](.ai/adr/ADR-006-overlay-card-and-status-icons.md) |
| Right-click menu, toolbar button, permissions, fetching image bytes | [background](src/background/AGENTS.md), [ADR-007](.ai/adr/ADR-007-mv3-desktop-esr.md) |
| Options page, stored settings | [settings](src/settings/AGENTS.md) |
| Messages between background and content script | [background](src/background/AGENTS.md), [content](src/content/AGENTS.md) |
| Test fixtures, unit or E2E tests | [tests](tests/AGENTS.md), [ADR-011](.ai/adr/ADR-011-vitest-and-selenium.md) |
| Build, manifest, CI, AMO submission | [ADR-008](.ai/adr/ADR-008-typescript-zod-vite-web-ext.md), [ADR-013](.ai/adr/ADR-013-amo-public-listing.md) |
| Record a decision | [.ai/adr](.ai/adr/README.md) |
| Plan a 3+ step task | [.ai/specs](.ai/specs/README.md) |

## Conventions

- Commits: [conventional commits](https://www.conventionalcommits.org/).
- Every commit made in an AI-assisted session carries an `Assisted-by: <agent-name>/<model-id>` trailer, with both
  values substituted by the agent's own.
- TypeScript style: Prettier (print width 120), ESLint with `typescript-eslint` strict. camelCase functions and
  variables, PascalCase types and classes, UPPER_SNAKE_CASE constants, kebab-case file names.
- ES modules only; `browser.*` from `webextension-polyfill` types, never `chrome.*`.
- Divide code into files: keep Zod schemas and types (`*.schema.ts`, `types.ts`) separate from the logic that uses
  them, and don't put everything in one file.
- Results, not exceptions, across module boundaries: extractors return `ExtractResult`, verifiers return
  `VerificationCheck[]` (types in [registry](src/registry/AGENTS.md)).
- Tests: never compare a fixed date with the real clock. Verifiers take `now: Date` as a parameter; tests pass a
  fixed `now`.
- Validation in a command chain: check the command's own exit code; `cmd | tail` reports `tail`'s.

## Workflow

1. Small task (1–2 steps): follow the router, change, run the scoped **Validate** command.
2. Task with 3+ steps: write a spec in [.ai/specs](.ai/specs/README.md) first. Each task in it lists its own
   **Load** files; read exactly those.
3. A decision that future work must respect: write an ADR in [.ai/adr](.ai/adr/README.md).
4. When the user corrects you, add an entry to [.ai/lessons.md](.ai/lessons.md) so it doesn't repeat.
