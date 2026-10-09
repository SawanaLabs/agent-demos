---
title: Branch Workflow
description: Durable conventions for dedicated worker branches and the pull-request path into main.
updateAt: 2026-09-24
---

# Branch Workflow

## Scope

- Covers git branch ownership, remote branch lifecycle, and how changes reach `main` on `SawanaLabs/agent-demos`.

## Rules

- `main` is the integration branch. Changes reach it through pull requests; do not commit directly on a local `main`.
- Each agent worker develops on a dedicated long-lived branch:
  - VM-based Claude sessions use `dev`.
  - The Hermes Worker, a separate local clone of this repository on the same machine, uses `hermes`.
- Dedicated worker branches are reserved infrastructure. Do not delete them when they look idle, do not develop on another worker's branch, and do not recreate another worker's branch on its behalf.
- Short-lived task branches such as `hermes-issue-10` may be deleted after their PR merges.
- Keep the dedicated branch close to `main`: fast-forward or merge `main` into it after upstream merges so the next PR stays reviewable.
- This repository has no GitHub Actions CI. Run the local quality gates (`pnpm check`, `pnpm typecheck`, `pnpm build` as scoped) before opening a pull request.

## Update Triggers

- Update this file when worker branch assignments, the merge path into `main`, or remote branch lifecycle rules change.
