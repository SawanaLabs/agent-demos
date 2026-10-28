---
title: Page Localization
description: Chinese and English page copy, language persistence, and portable demo boundaries.
updateAt: 2026-10-28
---

# Page Localization

## Scope

- Covers visible site and demo copy in `apps/web`, the language switch, and `apps/web/i18n`.
- The supported locales are English (`en`, the default) and Simplified Chinese (`zh-CN`).

## Current Subdomain Docs

- `next-intl` uses `i18n/request.ts`, its Next.js plugin, and `NextIntlClientProvider` in the root layout. Locale selection does not add URL prefixes or change API routes.
- The language switch calls a Server Action that writes the `agent-demos-locale` cookie for one year. Next.js rerenders the current route after that action; the request configuration reads the cookie, and the root HTML `lang` follows the selected locale.
- `i18n/messages/en.json` and `zh-CN.json` own page translations. Keep their keys in sync. `pageCopyKey` normalizes whitespace and escapes percent signs and dots so existing copy can form a single next-intl message key.
- `components/page-copy.tsx` is a portable React context. Use `PageText` for visible string children and `usePageCopy()` for string-only props such as placeholders, accessible labels, and Shimmer text. `PageText` adds no HTML wrapper.
- `i18n/site-page-copy.tsx` bridges that context to next-intl. Explicitly marked copy with a missing dictionary entry throws, so newly introduced gaps stay visible during development and acceptance.
- Translate fixed labels, descriptions, action text, and sample-prompt labels at the rendering boundary. User input, model responses, tool results, code, provider identifiers, and editable canvas content retain their original values. Translating a sample-prompt label does not rewrite the request sent to the model.
- Portable registry demos include the page-copy context as a shared registry asset. Its default translation function preserves English source text, so consumers do not need next-intl or this site's locale setup. Keep host-specific i18n imports out of registry feature slices and `packages/ui` primitives.
- English and Chinese use left-to-right layout. Check both scripts on desktop and narrow mobile viewports; labels must wrap without hiding actions or overlapping the global controls.
- `i18n/page-copy.test.tsx` covers standalone registry behavior, both next-intl locales, unchanged conversation content, and catalog/dictionary coverage. UI acceptance also needs a deployed Preview to verify cookie persistence, navigation, and layout.

## Update Triggers

- Update this file when supported locales, persistence, routing, translation ownership, or registry boundaries change.
- Update the dictionaries alongside changes to explicitly translated page copy.
