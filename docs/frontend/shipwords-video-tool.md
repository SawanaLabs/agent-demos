---
title: ShipWords video UI slice
description: Source attribution, copy boundary, and fixed-output test generation for the Tiny Desk video tool adaptation.
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
- The stage SVG is original. The bundled `public/shipwords-video/mock-result.mp4`
  is the original site's public dog band sample, used with the user's approval.
  Its footage/music are separate from the MIT code license; preserve the media
  source and license boundary in `NOTICE.md` when copying this slice.
- Photos use local object URLs and stay in the browser. The generation action
  validates photo presence and permission, fetches the bundled video through
  `model/mock-generation.ts`, then automatically shows playback and download.
- Every test run returns the same video. This adapts upstream's fixed
  `UPSTREAM_MOCK_RESULT` behavior without Cloudflare jobs or model calls.
  Keep test-mode disclosure beside the generate action and result.
- Cancel, reset, cast edits, and unmount abort pending video requests. Request
  and playback failures show a retry action and preserve the cast.
- There is no photo upload, paid call, account, or credit mutation in this slice.
- `model/cast.ts` owns move/swap behavior and the validation contract.
  Drag-and-drop has a select-based keyboard and touch alternative.
- Copy uses `PageText` and `usePageCopy`; keep English and Chinese catalogs in sync.

## Update triggers

Update this document when connecting a generation provider, changing the copy
boundary, importing additional upstream material, or changing the source revision.
