<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ADR-013: Public listing on addons.mozilla.org

- **Status:** Accepted
- **Date:** 2026-11-01
- **Evidence:** maintainer decision during the project questionnaire, 2026-11-01
- **Supersedes:** none

## Context

The maintainer wants public distribution through AMO.

## Decision

The extension is published as a listed add-on on AMO, signed with `web-ext sign`. Each submission includes the source archive and build instructions (`README.md` → *Building from source*), and a privacy policy stating that nothing is collected and that network requests happen only on an explicit *Verify online* click. Submission happens only with the maintainer's go.

## Consequences

Minified or obfuscated code is avoided in `dist/`. Permissions and network behaviour must match the listing text. AMO API credentials are never committed.

## Related files

- `README.md`
- `PRIVACY.md`
