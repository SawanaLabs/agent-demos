---
title: Database Workflow
description: Durable rules for schema sync, Drizzle CLI usage, and escalation when database changes are blocked.
updateAt: 2026-05-26
---

# Database Workflow

## Scope

- Covers `packages/database`, root `pnpm db:*` commands, and how schema changes reach the shared Postgres database.

## Rules

- Treat the database schema as a shared repository contract. Every schema change must originate from `packages/database/src/schema.ts` or the schema files it re-exports.
- Use CLI workflows only for database synchronization:
  - `pnpm db:generate`
  - `pnpm db:migrate`
  - `pnpm db:push`
  - `pnpm db:pull`
  - `pnpm db:studio`
- Do not apply schema changes through ad hoc SQL, custom scripts, direct driver calls, GUI consoles, or one-off patch commands unless the user explicitly asks for that path.
- Prefer the root `pnpm db:*` commands first. Drop to `pnpm --filter @workspace/database ...` only when the package-level command is the actual subject of the task.
- If a database sync command is blocked, slow, interactive, or risky, stop and ask the user to choose the path forward. Always include one concrete recommendation with that question.

## Drizzle State Model

- `pnpm db:generate` reads the current TypeScript schema and the latest local `packages/database/drizzle/meta/*_snapshot.json`, then writes a SQL migration, a matching snapshot, and a `_journal.json` entry.
- `pnpm --filter @workspace/database exec drizzle-kit check` validates local migration history consistency. It does not prove the current remote database can replay the newest migration.
- `pnpm db:migrate` reads local migration files and the remote `drizzle.__drizzle_migrations` ledger. It runs migrations whose hashes and timestamps are missing from that remote ledger.
- A successful `db:push` or interrupted migration can leave the remote schema ahead of the remote migration ledger. The symptom is a generated migration that tries to create tables or constraints already present in the remote database.

## Drift Recovery

- When `pnpm db:migrate` fails after `pnpm db:generate`, first check whether the generated migration files are untracked and whether the remote database already contains the objects the migration would create.
- Do not delete the whole `packages/database/drizzle/` directory unless the target database is disposable and will be rebuilt from an empty schema. Deleting migration history without resetting the database usually turns ledger drift into repeated `table already exists`, `index already exists`, or `constraint already exists` failures.
- If the remote database is disposable, the clean development recovery is:
  1. keep the intended TypeScript schema,
  2. regenerate migrations with `pnpm db:generate`,
  3. recreate or reset the development database,
  4. run `pnpm db:migrate`,
  5. run `pnpm --filter @workspace/database exec drizzle-kit check`.
- If the remote database must keep data and its structure already matches the generated migration, repair the remote ledger only after explicit user approval:
  1. verify the expected tables, columns, constraints, and indexes exist remotely,
  2. compute the generated SQL file hash with `shasum -a 256 packages/database/drizzle/<migration>.sql`,
  3. read the matching `when` timestamp from `packages/database/drizzle/meta/_journal.json`,
  4. insert that hash and timestamp into `drizzle.__drizzle_migrations`,
  5. rerun `pnpm db:migrate` and confirm it succeeds.
- Ledger repair is bookkeeping, not a schema change. It is acceptable only when the remote schema already matches the migration and the user explicitly chooses to preserve that remote data.

## Prevention

- Use one flow per database. For shared or production-like databases, prefer `pnpm db:generate`, review the SQL, commit the migration files, then run `pnpm db:migrate`.
- Treat `pnpm db:push` as a rapid prototyping tool for disposable databases. If `db:push` is used against a shared development database, expect possible migration ledger drift and verify before committing generated migrations.
- Before committing a database change, run:
  - `pnpm db:generate`
  - `pnpm --filter @workspace/database exec drizzle-kit check`
  - `pnpm db:migrate` against a clean development database or newly created Neon development branch when the migration creates new tables.
- Keep generated migration SQL, `meta/*_snapshot.json`, and `meta/_journal.json` together. Do not commit one without the others.

## Escalation Pattern

- When blocked by an interactive prompt, connectivity issue, drift, or destructive statement review:
  1. report the exact blocker,
  2. explain the likely cause in one or two sentences,
  3. ask the user for a decision,
  4. include one recommended next action.
- Keep the recommendation concrete, for example:
  - run `pnpm db:push` in an interactive terminal,
  - switch to `pnpm db:migrate` and generate a migration,
  - inspect the drift before approving a destructive statement.

## Notes

- `drizzle-kit push` may require an interactive TTY confirmation when statements change existing tables or constraints.
- Because this repository uses Neon serverless connections, command latency during schema pull can come from the remote websocket path, not just from local tooling.
