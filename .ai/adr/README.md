<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# Architecture Decision Records

Decisions that future work must respect. Read an ADR only when the Task Router, a scoped `AGENTS.md` or a spec links to it.

## Rules

- One decision per file: `ADR-NNN-slug.md`, numbered sequentially, copied from [TEMPLATE.md](TEMPLATE.md).
- Status: `Proposed`, `Accepted`, `Accepted (retroactive)`, `Superseded by ADR-MMM`, `Deprecated`.
- Retroactive ADRs record decisions already visible in the code. Their date is that of the commit where the decision first appears, and they cite the evidence.
- Supersede, don't rewrite: a changed decision gets a new ADR, and the old one only gets its status changed to `Superseded by ADR-MMM`.
- Add every ADR to the index below.

## Index

| ADR | Title | Status | Date |
|---|---|---|---|
| [ADR-001](ADR-001-eupl-and-spdx-headers.md) | EUPL-1.2 licence with SPDX headers | Accepted | 2026-11-01 |
| [ADR-002](ADR-002-no-code-comments.md) | No comments in source code | Accepted | 2026-11-01 |
| [ADR-003](ADR-003-baked-only-detection.md) | Detect only baked Open Badges 2.0 and 3.0 in PNG and SVG | Accepted | 2026-11-01 |
| [ADR-004](ADR-004-on-demand-scanning.md) | On-demand scanning by default | Accepted | 2026-11-01 |
| [ADR-005](ADR-005-offline-first-verification.md) | Offline-first verification; online checks only on an explicit click | Accepted | 2026-11-01 |
| [ADR-006](ADR-006-overlay-card-and-status-icons.md) | Shadow-DOM overlay card, corner status icons, careful non-baked wording | Accepted | 2026-11-01 |
| [ADR-007](ADR-007-mv3-desktop-esr.md) | Manifest V3, Firefox desktop ESR 140+ | Accepted | 2026-11-01 |
| [ADR-008](ADR-008-typescript-zod-vite-web-ext.md) | TypeScript, Zod, Vite and web-ext, no UI framework | Accepted | 2026-11-01 |
| [ADR-009](ADR-009-plugin-registry.md) | Plug-in registry for extractors, formats and verifiers | Accepted | 2026-11-01 |
| [ADR-010](ADR-010-untrusted-input.md) | Baked payloads and page images are untrusted input | Accepted | 2026-11-01 |
| [ADR-011](ADR-011-vitest-and-selenium.md) | Vitest for unit tests, Selenium and geckodriver for E2E | Accepted | 2026-11-01 |
| [ADR-012](ADR-012-english-ui-through-i18n.md) | English-only UI, all strings through browser.i18n | Accepted | 2026-11-01 |
| [ADR-013](ADR-013-amo-public-listing.md) | Public listing on addons.mozilla.org | Accepted | 2026-11-01 |
| [ADR-014](ADR-014-bundled-jsonld-canonicalisation.md) | Bundle JSON-LD canonicalisation for offline eddsa-rdfc-2022 | Accepted | 2026-11-01 |
| [ADR-015](ADR-015-no-eval-in-bundle.md) | Remove eval paths from dependencies at build time | Accepted | 2026-11-02 |
