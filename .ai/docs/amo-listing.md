<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# AMO listing draft

> AI-generated draft. The maintainer reviews and edits it before submission.

## Name

OpenBadge Inspector

## Summary (250 characters max)

Check whether a badge image on any web page is a real Open Badge. Right-click an image to see who issued it, when,
and whether its signature is valid. Works offline; contacts issuers only when you ask.

## Description

Digital badges often appear on profiles, CVs and course pages as plain images. OpenBadge Inspector reads the Open
Badges data baked into those images and shows what the badge really is.

**How to use it**
- Right-click an image and choose **Inspect Open Badge** to see the badge name, issuer, issue and expiry dates,
  standard, and the result of each check.
- Click the toolbar button to mark every image on the page: ✓ verified, ! not verified, ◷ expired, ✕ invalid or
  revoked, – not a badge.
- Optionally, turn on automatic scanning in the settings.

**What it checks**
- Open Badges 3.0: data model, dates, Data Integrity proofs (eddsa-rdfc-2022, eddsa-jcs-2022) and VC-JWT signatures.
- Open Badges 2.0: data model and dates offline; hosted assertions, signatures and revocation online.
- PNG and SVG badges in normal images, `<picture>`, inline SVG and embedded SVG.

**Privacy**
Everything runs on your device. No data collection, no analytics. Issuers are contacted only if you turn on online
verification and click **Verify online** on a badge.

An image without badge data is labelled "Not an Open Badge". Some websites strip this data when they resize
images, so a real badge can show up that way; the label says so.

## Categories

Privacy & Security; Search Tools

## Support

- Homepage: https://github.com/fajfer/openbadge-inspector
- Support: https://github.com/fajfer/openbadge-inspector/issues
- Privacy policy: contents of `PRIVACY.md`

## Notes to reviewer

Upload `openbadge-inspector-<version>.zip` and `openbadge-inspector-<version>-source.zip` from the GitHub Release
(SLSA Build L3 provenance attached). Source: this repository at the submitted tag. Build: Node.js 24, `npm ci && npm run build`; the output in `dist/` is
not minified and is reproducible. `jsonld` is bundled for offline RDF canonicalisation of Open Badges 3.0
credentials; it uses only bundled contexts and never fetches remote ones. Eval code paths in Zod and the
`setimmediate` polyfill are removed at build time (`scripts/build.ts`).
