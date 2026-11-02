<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# OpenBadge Inspector

A Firefox extension that finds [Open Badges](https://www.1edtech.org/standards/open-badges) baked into images on
any web page and tells you whether they are real.

- **Right-click any image → Inspect Open Badge** shows a card with the badge name, issuer, dates, standard and the
  result of every check. An image without badge data is labelled *Not an Open Badge: this image contains no Open
  Badges data. (Badges re-uploaded or resized by some sites lose this data.)*
- **Toolbar button** scans the whole page and puts a marker on each image: green ✓ verified, yellow ! not verified,
  orange ◷ expired, red ✕ invalid or revoked, grey – not a badge.
- **Automatic scanning** can be switched on in the settings. It's off by default.

## What it checks

| Badge | Offline (always) | Online (only when you click *Verify online*) |
|---|---|---|
| Open Badges 3.0, Data Integrity proof (`eddsa-rdfc-2022`, `eddsa-jcs-2022`) | Schema, dates, signature with a `did:key` key | Keys on `did:web` or HTTPS, revocation through `BitstringStatusListEntry` or `1EdTechRevocationList` |
| Open Badges 3.0, VC-JWT (`EdDSA`, `ES256`, `RS256`) | Schema, dates, signature with an embedded JWK or `did:key` | Keys on `did:web` or HTTPS |
| Open Badges 2.0, hosted | Schema, dates | Compare with the issuer's hosted copy, revocation, load badge and issuer details |
| Open Badges 2.0, signed (JWS) | Schema, dates | Signature with the issuer's key, issuer revocation list |

Badges are read from PNG `iTXt` chunks and SVG `openbadges:assertion` / `openbadges:credential` elements, in `<img>`,
`<picture>`, inline `<svg>`, and SVG `<object>` / `<embed>`. Badges that some tools store in other PNG text chunks
(e.g. `zTXt` "openbadge") are read too, with a warning on the card.

Badges shown on platforms such as Credly are usually plain images without badge data, so they show as *Not an Open
Badge*. Download the baked badge and open it to inspect it.

## Privacy

Everything happens on your device. The extension collects no data and has no analytics. It contacts a badge issuer
only when you click *Verify online* on a badge's card. Some issuers block browser extensions from reading their badge
data; for those, the card offers to allow online checks to reach every issuer in the settings. See
[PRIVACY.md](PRIVACY.md).

## Building from source

Requirements: Node.js 24 and npm.

```sh
npm ci
npm run build          # writes the unpacked extension to dist/
npx web-ext build -s dist   # packs dist/ into web-ext-artifacts/*.zip
```

The build is not minified, and the same commit always produces the same `dist/`.

## Verifying a release

Every GitHub Release contains the extension zip, the source zip, CycloneDX and SPDX SBOMs, `SHA256SUMS` and SLSA
Build L3 provenance (`openbadge-inspector.intoto.jsonl`). Check a download with
[slsa-verifier](https://github.com/slsa-framework/slsa-verifier):

```sh
slsa-verifier verify-artifact openbadge-inspector-0.1.0.zip \
  --provenance-path openbadge-inspector.intoto.jsonl \
  --source-uri github.com/fajfer/openbadge-inspector \
  --source-tag v0.1.0
```

The add-on installed from addons.mozilla.org is this zip plus Mozilla's signature.

## Development

| Task | Command |
|---|---|
| Try it on a gallery of test badges | `npm run demo` |
| Unit tests | `npm test` |
| End-to-end tests in headless Firefox | `npm run test:e2e` (`E2E_HEADED=1` to watch) |
| Lint, including the no-comments rule | `npm run lint` |
| Types | `npm run typecheck` |
| Regenerate test badges | `npm run fixtures` |

Rules for contributors and AI agents are in [AGENTS.md](AGENTS.md). Design decisions are recorded in
[.ai/adr](.ai/adr/README.md).

## Licence

[EUPL-1.2](LICENSE). Bundled JSON-LD contexts keep their own licences; see [REUSE.toml](REUSE.toml).
