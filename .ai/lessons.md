<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# Lessons

Corrections from the user that should not repeat. Add one entry per correction, newest first. Read this only
when the Task Router or a scoped file points here, or before starting a spec.

## Format

```markdown
### YYYY-MM-DD: <tag or module, e.g. extractors, ui, commits>

- **Mistake:** what the agent did.
- **Rule:** what to do instead, stated so it can be checked.
```

If a lesson becomes a lasting rule, move it into the narrowest `AGENTS.md` it applies to and delete it here.

## Entries

### 2026-11-02: extractors, diagnosis

- **Mistake:** a real OB 3.0 badge showed as "Not an Open Badge", and the agent blamed the hosting site for stripping
  the data after checking with exiftool, without running the extension's own extractor on the served bytes. The
  extension only read the OB 2.0 keyword.
- **Rule:** when a badge is reported as not baked, run `pngExtractor`/`svgExtractor` on the exact bytes the page
  serves before suspecting the site, and compare the baking location with the spec version of the payload.

### 2026-11-02: e2e, permissions

- **Mistake:** the E2E suite granted `<all_urls>` before scanning, so the default flow (toolbar click with only
  temporary tab access) was never tested. The demo showed "Couldn't read this image" on every image while all
  tests passed.
- **Rule:** run every user-facing flow at least once in a fresh profile with no optional permissions, triggered
  the way a user triggers it. Before saying a feature works, check it under the default install, not only the
  configured one.
