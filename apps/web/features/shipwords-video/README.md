# ShipWords video UI slice

Open `/tools/shipwords-video`. The homepage links to it as a separate UI tool.

## Copy boundary

Copy this folder, `app/tools/shipwords-video/page.tsx`, and
`public/shipwords-video/`. Keep [NOTICE.md](./NOTICE.md) and
[LICENSE.shipwords](./LICENSE.shipwords).

The UI uses React, Next.js Link, Phosphor icons, shared shadcn `Button`,
`Checkbox`, and `NativeSelect`, and the host's semantic theme tokens.
`@/components/page-copy` provides portable English defaults; copy that adapter
or replace it with your own translation function. The host's English and Chinese
catalogs contain this page's translations.

## Runtime boundary

This is a browser-only UI demonstration. Photo uploads and optional sample
video playback use object URLs. Files stay in the browser and reset clears them.
The preset buttons highlight cast seats. Uploaded photos can move or swap through
drag and drop or keyboard-accessible selects.

The primary action validates a photo and permission, then opens the generation
state preview. The state selector explicitly controls ready, generating, result,
and error views. There is no simulated completion timer or generation request.
Download exports only the sample video selected by the visitor.

To connect real generation, replace `startPreview` and the manual state selector
with a server job contract, owned reference media, and provider-backed job status.
The upstream example's private media, accounts, billing, and shared core are
outside this slice. See [NOTICE.md](./NOTICE.md) for the pinned source.
