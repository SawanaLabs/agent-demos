---
title: Branch Preview Review
description: Use Vercel-generated branch URLs as the standard review surface for new Agent Demos and pre-merge checks.
updateAt: 2026-09-26
---

# Branch Preview Review

## Scope

- Covers how Sawana and agents review in-flight work on the deployed Vercel project for this repository.
- Applies to any change that ships through a Git branch or pull request before merging to the production branch.

## Decision

- The default review surface for new work is the **Vercel branch URL**, not a local dev server screenshot, not a staging build we host ourselves, and not the production domain.
- When a branch is pushed, Vercel creates a preview deployment and exposes a stable branch URL of the form `<project>-git-<branch>-<scope>.vercel.app`. That URL always points to the latest deployment on that branch.
- Sawana will open that branch URL to review what is about to ship, especially when a new Agent Demo or a visible site change is about to land.

## Working Rules

- Agents preparing work for review push the branch to the connected Git remote so Vercel builds the preview. A draft PR is acceptable when it helps surface the preview link.
- Hand-off messages for review should include the branch URL, not only the commit or PR number. When the exact URL is not known, give the branch name and say "use the Vercel branch preview URL"; Sawana can pick it up from the PR comment or the Vercel dashboard.
- Review-ready means the branch preview deployment has finished building. Do not ask for review on a branch whose Vercel check is still running or failed.
- For demos that depend on preview-only environment variables or services (e.g. sandbox providers, test keys), confirm the preview deployment actually exercises the feature before asking Sawana to click through it.
- Branch previews are still previews. Do not point them at production writes (production database mutations, real payments, real outbound email) unless the task explicitly calls for it.

## What Sawana Reviews There

- Visual and interaction quality of the new or changed demo on a real deployment.
- Homepage / catalog changes that only appear once the branch is merged.
- Any UX copy, empty-state, or telemetry-visible behavior he wants to sanity-check before merge.

## Notes and Boundaries

- The branch URL is publicly reachable by default unless Deployment Protection is enabled on the project. Treat links as shareable but not secret.
- Pushing new commits to the same branch keeps the same branch URL but swaps the underlying deployment. If Sawana is mid-review, say so in the hand-off before pushing follow-up commits.
- For a fixed snapshot that should not move during review, prefer the per-commit deployment URL (visible from the PR "View deployment" link or the Vercel dashboard) over the branch URL.
