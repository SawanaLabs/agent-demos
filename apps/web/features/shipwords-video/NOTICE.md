# ShipWords video UI attribution

This slice adapts the Tiny Desk AI video tool UI and cast interactions from
[ShipWords](https://github.com/shipwords-dev/shipwords/tree/faa8b34c6d9da14dbc4c7541e888259772117c70/sites/tinydeskai-example).

Upstream commit: `faa8b34c6d9da14dbc4c7541e888259772117c70`.
Copyright (c) 2026 shipwords contributors. MIT license.
The full upstream notice is preserved in [LICENSE.shipwords](./LICENSE.shipwords).
Keep both files when copying or distributing this slice.

The Next.js components adapt the source's five photo seats, cast presets,
photo swapping, permission step, portrait preview, and generation states.
The stage SVG is an original illustration. This slice includes no upstream
photographs, brand assets, payment code, or generation backend.

## Fixed test video

`public/shipwords-video/mock-result.mp4` is the publicly served dog band sample
from [Tiny Desk AI](https://tinydeskai.io/media/sample-dogs.mp4), retrieved
2026-10-29. ShipWords' own website embeds this same sample in
[`apps/www/public/index.html`](https://github.com/shipwords-dev/shipwords/blob/faa8b34c6d9da14dbc4c7541e888259772117c70/apps/www/public/index.html).
The user authorized using it for this fixed-output test slice.

The upstream example explicitly excludes third-party footage and music from
its repository. Its MIT code license does not establish a license for this video.
Preserve this separate media provenance when copying the slice; replace the
sample with owned media for a separately distributed product.
