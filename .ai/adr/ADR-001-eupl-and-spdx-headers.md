<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ADR-001: EUPL-1.2 licence with SPDX headers

- **Status:** Accepted
- **Date:** 2026-11-01
- **Evidence:** [PROMPT.md](../../PROMPT.md)
- **Supersedes:** none

## Context

PROMPT.md Q4.4: the owner's projects use EUPL-1.2 with SPDX headers on every file (as in fajfer/chronowarden). AMO accepts EUPL-1.2 as an open-source licence.

## Decision

The project is licensed under EUPL-1.2. Every file carries `SPDX-FileCopyrightText: <years> Damian Fajfer <damian@fajfer.org>` and `SPDX-License-Identifier: EUPL-1.2` in its own comment style. Files that cannot hold a comment (JSON, PNG/SVG fixtures, lockfiles) are covered by a `<file>.license` sidecar or an annotation in `REUSE.toml`. The repo is REUSE-compliant and `reuse lint` runs in CI.

## Consequences

Every new file needs a header; CI fails without one. Year ranges must be kept current. Third-party fixtures (e.g. from the 1EdTech conformance suite) keep their own licence and are annotated in `REUSE.toml`.

## Related files

- `LICENSE`
- `REUSE.toml`
- `.github/workflows/ci.yml`
