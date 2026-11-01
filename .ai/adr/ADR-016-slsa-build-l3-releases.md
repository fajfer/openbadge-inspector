<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ADR-016: SLSA Build L3 releases with SBOMs

- **Status:** Accepted
- **Date:** 2026-11-02
- **Evidence:** maintainer decision of 2026-11-02; follows fajfer/chronowarden ADR-018
- **Supersedes:** none

## Context

The extension is meant to help people trust badges, so its own build must be verifiable. The maintainer asked for
SLSA Build L3 compliance, as in chronowarden.

## Decision

- `.github/workflows/release.yml` runs on `v*.*.*` tags. It checks that the tag matches `package.json` and
  `manifest.json`, builds and lints the extension, and produces the extension zip, the source zip for AMO review,
  CycloneDX 1.6 and SPDX 2.3 SBOMs, and `SHA256SUMS`.
- **SLSA Build L3** provenance comes from the `slsa-framework/slsa-github-generator` generic generator, referenced by
  tag (the SLSA verifier requires it; documented zizmor exception). No GitHub artifact attestations.
- Release builds use no caches. All other actions are pinned by commit SHA.
- The zip uploaded to AMO is the one from the GitHub Release. AMO signs it, so the installed `.xpi` differs from
  the attested zip by Mozilla's signature only.

## Consequences

- Releases come only from tags pushed to `main`. Users verify them with `slsa-verifier` (README).
- Zip timestamps differ between builds, so the zip itself is not byte-reproducible; `dist/` is.

## Related files

- `.github/workflows/release.yml`, `README.md`
