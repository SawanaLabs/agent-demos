#!/usr/bin/env bash
set -euo pipefail

sandbox_integration=0

if [[ "${1:-}" == "--sandbox" ]]; then
  sandbox_integration=1
  shift
fi

if [[ "${1:-}" == "--" ]]; then
  shift
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
web_dir="$repo_root/apps/web"

set -a
for env_file in \
  "$repo_root/.env" \
  "$repo_root/.env.local" \
  "$repo_root/.env.development.local" \
  "$web_dir/.env.local" \
  "$web_dir/.env.development.local"; do
  if [[ -f "$env_file" ]]; then
    . "$env_file"
  fi
done
set +a

if [[ "$sandbox_integration" == "1" ]]; then
  export VERCEL_SANDBOX_INTEGRATION=1
fi

cd "$web_dir"
exec vitest run --config vitest.integration.config.ts "$@"
