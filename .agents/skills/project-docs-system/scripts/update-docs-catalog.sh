#!/usr/bin/env bash
set -euo pipefail

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)"

if ! command -v uv >/dev/null 2>&1; then
  printf 'ERROR: uv is required to run the docs catalog updater.\n' >&2
  exit 127
fi

exec uv run --isolated python "$script_dir/update_docs_catalog.py" "$@"
