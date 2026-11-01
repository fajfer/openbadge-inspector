<!--
SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>

SPDX-License-Identifier: EUPL-1.2
-->
# ADR-014: Bundle JSON-LD canonicalisation for offline eddsa-rdfc-2022

- **Status:** Accepted
- **Date:** 2026-11-01
- **Evidence:** maintainer decision on the v1 spec's open questions
- **Supersedes:** none

## Context

`eddsa-rdfc-2022` is the most common Data Integrity proof on OB 3.0 credentials. Verifying it needs JSON-LD expansion
and RDF Dataset Canonicalization (RDFC-1.0), which `crypto.subtle` doesn't provide. Without it most OB 3.0 badges
would stay yellow.

## Decision

Bundle `jsonld` and `rdf-canonize` as runtime dependencies (approved by the maintainer). The document loader serves
only contexts bundled in `src/verifiers/contexts/` (VC 1.1/2.0, OB 3.0, Data Integrity, did:key/multikey) and
rejects any other URL, so no remote context is ever loaded. Canonicalisation runs with a time and size budget; going
over it gives a `not-run` check with reason `canonicalisation-limit`.

## Consequences

The bundle grows by roughly 100 KB or more; AMO reviewers get the unminified source. A credential that uses an
unbundled context can't be verified offline; adding a context is a reviewed change with its SPDX/licence
annotation. Library updates go through the normal dependency review.

## Related files

- `src/verifiers/offline/ob3-data-integrity.ts`
- `src/verifiers/contexts/`
- `package.json`
