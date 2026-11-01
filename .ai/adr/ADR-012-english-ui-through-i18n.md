<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ADR-012: English-only UI, all strings through browser.i18n

- **Status:** Accepted
- **Date:** 2026-11-01
- **Evidence:** maintainer decision during the project questionnaire, 2026-11-01
- **Supersedes:** none

## Context

The maintainer chose English only for v1. Adding a language later shouldn't require code changes.

## Decision

`default_locale` is `en`. Every user-visible string (manifest name/description, menu items, card labels, icon labels, options page) is a key in `_locales/en/messages.json`, read with `browser.i18n.getMessage`.

## Consequences

Adding a language means adding one `messages.json` file. Tests compare against message keys, not English text.

## Related files

- `_locales/en/messages.json`
