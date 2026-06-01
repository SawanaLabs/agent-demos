#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/registry-sync/foundation-chat.sh --check
  scripts/registry-sync/foundation-chat.sh --write

Modes:
  --check  Validate the manifest transforms and fail on drift without writing.
  --write  Sync registry source files from app-first files, then run pnpm registry:build.
EOF
}

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

mode="$1"
case "$mode" in
  --check|--write) ;;
  *)
    usage
    exit 1
    ;;
esac

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
manifest_path="$script_dir/foundation-chat.manifest.json"

if [[ "$mode" == "--write" ]]; then
  node "$script_dir/sync-registry-demo.mjs" --manifest "$manifest_path" --write --build
else
  node "$script_dir/sync-registry-demo.mjs" --manifest "$manifest_path" --check
fi
