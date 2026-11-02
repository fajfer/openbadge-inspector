<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# Privacy policy

OpenBadge Inspector does not collect, store or send any personal data, browsing history or usage statistics.

## What happens on your device

When you scan a page or inspect an image, the extension reads the image file again (normally from Firefox's cache)
and looks for Open Badges data in its metadata. This happens inside Firefox. Results are kept in memory only while
Firefox runs.

## When the network is used

Only when you click **Verify online** on a badge's card, the
extension downloads the documents needed to check that badge from the addresses written in the badge itself: the
hosted assertion, the badge and issuer descriptions, the issuer's public key, and its revocation or status list.
These requests carry no cookies. The issuer's server can see that someone at your IP address checked the badge.

## Permissions

- **Access to the current tab** when you click the toolbar button or the menu item, to read images on that page.
- **Access to all websites** only if you turn on automatic scanning or "Let online checks reach every issuer", or
  allow it for a single image host when inspecting an image from another site.
- **Storage** for your three settings.

## Contact

Damian Fajfer, damian@fajfer.org
