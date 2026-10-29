# ShipWords video UI slice

Open `/tools/shipwords-video`. The homepage links to it as a separate UI tool.

## Copy boundary

Copy this folder, `app/tools/shipwords-video/page.tsx`, and
`public/shipwords-video/`. Keep [NOTICE.md](./NOTICE.md) and
[LICENSE.shipwords](./LICENSE.shipwords).

The UI uses React, Next.js Link, Phosphor icons, shared shadcn `Badge`, `Button`,
`Card`, `Checkbox`, and `NativeSelect`, and the host's semantic theme tokens.
Its typography, panels, actions, and light/dark appearance follow Agent Demos.
`@/components/page-copy` provides portable English defaults; copy that adapter
or replace it with your own translation function. The host's English and Chinese
catalogs contain this page's translations.

## Runtime boundary

This is a browser-only tool with fixed-output test generation. Photo uploads
use object URLs. Photos stay in the browser and reset clears them.
The preset buttons highlight cast seats. Uploaded photos can move or swap through
drag and drop or keyboard-accessible selects.

The primary action validates a photo and permission, fetches the bundled
`public/shipwords-video/mock-result.mp4`, then automatically displays playback
and download. Every run returns the same dog band video regardless of the cast.
Cancel, reset, editing the cast, and unmount abort an in-flight request.
Failed requests and playback errors show a retry action while keeping the cast.

This adapts the fixed-result behavior of upstream's `UPSTREAM_MOCK_RESULT`;
it does not run the Cloudflare workflow, database, billing, or model adapters.
`model/mock-generation.ts` owns the fixed video request. No photo upload,
AI call, or credit mutation occurs. The page labels this as test mode.

To connect real generation, replace `generateMockVideo` with a server job
contract, owned reference media, and provider-backed job status.
See [NOTICE.md](./NOTICE.md) for code and sample media provenance.
