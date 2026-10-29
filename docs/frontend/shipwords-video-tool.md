---
title: ShipWords video UI slice
description: Source attribution, copy boundary, and browser-only runtime for the Tiny Desk video tool adaptation.
updateAt: 2026-10-29
---

# ShipWords video UI slice

## Scope

`/tools/shipwords-video` and `apps/web/features/shipwords-video/` contain a
standalone UI adaptation of ShipWords' Tiny Desk AI example. The homepage
exposes it alongside other tools, outside the Agent Demo catalog.

## Current subdomain docs

- The page visibly credits ShipWords and links to the pinned source, MIT license,
  and original live site. `source.ts` owns these links and the upstream SHA.
- Preserve the upstream copyright and full MIT text in `LICENSE.shipwords`.
  `NOTICE.md` describes the adaptation and must travel with copied code.
- The copy boundary and imports are documented in the feature's `README.md`.
  Keep the route thin and cast behavior inside this feature.
- The stage SVG is original. The upstream repository excludes its reference
  videos, music, and production media. This slice contains none of those assets.
- Photos and an optional sample video use local object URLs. There is no upload,
  generation API, paid call, account, or credit mutation in this slice.
- The generation action validates photo presence and permission. The state
  selector explicitly previews running, result, and error layouts. Download
  exports only the visitor's sample clip. Keep that distinction visible.
- `model/cast.ts` owns move/swap behavior and the validation contract.
  Drag-and-drop has a select-based keyboard and touch alternative.
- Copy uses `PageText` and `usePageCopy`; keep English and Chinese catalogs in sync.

## Update triggers

Update this document when connecting a generation provider, changing the copy
boundary, importing additional upstream material, or changing the source revision.
