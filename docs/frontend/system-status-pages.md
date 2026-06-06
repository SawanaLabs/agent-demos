---
title: System Status Pages
description: Durable conventions for branded app-level error, global-error, 404, and client exception reporting surfaces.
updateAt: 2026-06-06
---

# System Status Pages

## Scope

- Covers branded application status surfaces in `apps/web/app/error.tsx`, `apps/web/app/global-error.tsx`, and `apps/web/app/not-found.tsx`.
- Covers the app-level status wrapper in `apps/web/components/system-status-page.tsx`.
- Covers browser-originated exception reporting through `apps/web/app/api/client-errors/route.ts`.

## Current Subdomain Docs

- Keep branded status-page composition in `apps/web`, not `packages/ui`. These pages are app-specific wrappers around shared shadcn primitives.
- Compose status pages from `@workspace/ui` shadcn primitives and active theme tokens instead of hard-coded panel systems.
- Keep root `not-found`, `error`, and `global-error` copy page- or application-level. Add nested route-specific status pages only when a route group needs domain-specific wording.
- Report only unexpected client exceptions to `/api/client-errors`, such as route error boundaries, global error boundaries, window errors, and unhandled rejections.
- Do not report 404 pages through `/api/client-errors`. Use branded 404 UI for users, and rely on Vercel request/runtime log filters for status-code analysis.
- `/api/client-errors` should write sanitized structured JSON to runtime logs and should not persist client exception reports in the database.
- Keep client exception payloads small and privacy-conscious: path without query string, error message, optional digest, optional stack, source, event kind, and user-agent header are enough for the default route.
- Error-boundary Retry controls should call the boundary `reset()` and then hard reload the current URL so chunk-loading failures can recover after fresh assets become available.
- Treat Sentry or Vercel Drains as future observability layers for longer retention, grouping, source maps, and alerting. Add them behind this boundary instead of introducing a self-managed error-log table.

## Update Triggers

- Update this file when app-level error, global-error, 404, or client exception reporting boundaries change.
- Update this file when `/api/client-errors` starts forwarding to an external observability provider.
- Update this file before adding database persistence for client exception reports.
