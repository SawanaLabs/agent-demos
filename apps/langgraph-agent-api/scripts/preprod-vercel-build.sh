#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
api_dir="$(cd "$script_dir/.." && pwd)"
repo_dir="$(cd "$api_dir/../.." && pwd)"
api_project_json="$api_dir/.vercel/project.json"
root_vercel_dir="$repo_dir/.vercel"
root_project_json="$root_vercel_dir/project.json"

command -v uv >/dev/null || {
  echo "uv is required for the LangGraph Agent API PREPROD build." >&2
  exit 1
}

command -v vercel >/dev/null || {
  echo "vercel is required for the LangGraph Agent API PREPROD build." >&2
  exit 1
}

if [[ ! -f "$api_project_json" ]]; then
  echo "Missing $api_project_json. Run vercel pull for the API project first." >&2
  exit 1
fi

if [[ ! -f "$root_project_json" ]]; then
  echo "Missing $root_project_json. Run vercel pull for the web project first." >&2
  exit 1
fi

cd "$api_dir"

python_version="$(tr -d '[:space:]' < .python-version)"
uv python install "$python_version" >/dev/null

python_path="$(uv python find "$python_version")"
python_bin_dir="$(dirname "$python_path")"
export PATH="$python_bin_dir:$PATH"

backup_project_json="$(mktemp)"
cp "$root_project_json" "$backup_project_json"

cleanup() {
  cp "$backup_project_json" "$root_project_json"
  rm -f "$backup_project_json"
  rm -f "$root_vercel_dir/.env.production.local"
  rm -f "$api_dir/.vercel/.env.production.local"
}
trap cleanup EXIT

cp "$api_project_json" "$root_project_json"
cd "$repo_dir"

vercel build --prod --yes "$@"
