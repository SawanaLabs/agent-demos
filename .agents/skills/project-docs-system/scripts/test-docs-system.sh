#!/usr/bin/env bash
set -euo pipefail

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)"
tmp_root="$(mktemp -d)"

cleanup() {
  rm -rf "$tmp_root"
}
trap cleanup EXIT

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

write_doc() {
  path="$1"
  title="$2"
  description="$3"
  mkdir -p "$(dirname "$path")"
  cat >"$path" <<EOF
---
title: $title
description: $description
updateAt: 2026-07-06
---

# $title
EOF
}

make_base_docs() {
  repo="$1"
  write_doc "$repo/docs/DOCS.md" "Project Knowledge Protocol" "Repository docs protocol."
  write_doc "$repo/docs/index.md" "Docs Index" "Repository docs map."
  write_doc "$repo/docs/application/DOCS.md" "Application Protocol" "Application docs protocol."
  write_doc "$repo/docs/application/index.md" "Application" "Application docs map."
}

run_update() {
  "$script_dir/update-docs-catalog.sh" "$1" >/dev/null
}

run_verify_capture() {
  "$script_dir/verify-docs-system.sh" "$1" 2>&1
}

resource_repo="$tmp_root/resource-repo"
make_base_docs "$resource_repo"
write_doc "$resource_repo/docs/application/overview.md" "Overview" "Application overview."
mkdir -p "$resource_repo/docs/assets/homepage/how-it-works"
printf 'fake image bytes\n' >"$resource_repo/docs/assets/homepage/how-it-works/reference.png"
run_update "$resource_repo"
resource_output="$(run_verify_capture "$resource_repo")" || fail "resource directory fixture should verify"
if printf '%s\n' "$resource_output" | grep -q 'WARN:'; then
  fail "resource directory fixture should not emit warnings"
fi

deep_repo="$tmp_root/deep-repo"
make_base_docs "$deep_repo"
write_doc "$deep_repo/docs/application/homepage/index.md" "Homepage" "Homepage docs map."
write_doc "$deep_repo/docs/application/homepage/replication.md" "Replication" "Homepage replication notes."
run_update "$deep_repo"
if ! grep -Fq './replication.md' "$deep_repo/docs/application/homepage/index.md"; then
  fail "recursive catalog updater should update nested index files"
fi
deep_output="$(run_verify_capture "$deep_repo")" || fail "deep indexed docs fixture should verify"
if printf '%s\n' "$deep_output" | grep -q 'WARN:'; then
  fail "deep indexed docs fixture should not emit warnings"
fi

missing_index_repo="$tmp_root/missing-index-repo"
make_base_docs "$missing_index_repo"
write_doc "$missing_index_repo/docs/application/homepage/replication.md" "Replication" "Homepage replication notes."
run_update "$missing_index_repo"
if run_verify_capture "$missing_index_repo" >/dev/null; then
  fail "deep docs without an index should fail verification"
fi

printf 'Docs system script tests passed.\n'
