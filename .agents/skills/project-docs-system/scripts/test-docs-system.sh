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

hidden_parent_repo="$tmp_root/.hidden-parent/hidden-parent-repo"
make_base_docs "$hidden_parent_repo"
write_doc "$hidden_parent_repo/docs/application/homepage/replication.md" "Replication" "Homepage replication notes."
run_update "$hidden_parent_repo"
if run_verify_capture "$hidden_parent_repo" >/dev/null; then
  fail "deep docs without an index should fail verification under a hidden parent path"
fi

# Companions are reached through their living documents, never the catalog.
adr_repo="$tmp_root/adr-repo"
make_base_docs "$adr_repo"
write_doc "$adr_repo/docs/application/billing.md" "Billing" "Current billing behavior."
for stem in DOCS application/DOCS application/billing; do
  living="$adr_repo/docs/$stem.md"
  companion="$adr_repo/docs/$stem.adr.md"
  name="$(basename "$stem")"
  write_doc "$companion" "Decision history" "Why we chose this behavior."
  printf '\n[Decision history](./%s.adr.md)\n' "$name" >>"$living"
  printf '\n[Current documentation](./%s.md)\n\n## 2026-09-21 scoped-decision\n\nWe chose this behavior because it keeps ownership local.\n' "$name" >>"$companion"
done
run_update "$adr_repo"
if grep -q '\.adr\.md' "$adr_repo/docs/index.md" "$adr_repo/docs/application/index.md"; then
  fail "catalogs must omit companions"
fi
adr_output="$(run_verify_capture "$adr_repo")" || fail "companions without index entries should verify"
if printf '%s\n' "$adr_output" | grep -q 'WARN:'; then
  fail "valid companions should not produce warnings"
fi
cp "$adr_repo/docs/application/billing.adr.md" "$tmp_root/valid-adr.md"
sed '/Current documentation/d' "$adr_repo/docs/application/billing.adr.md" >"$tmp_root/no-backlink.md"
cp "$tmp_root/no-backlink.md" "$adr_repo/docs/application/billing.adr.md"
if run_verify_capture "$adr_repo" >/dev/null; then
  fail "missing companion backlink should fail"
fi

cp "$tmp_root/valid-adr.md" "$adr_repo/docs/application/billing.adr.md"
sed '/Decision history/d' "$adr_repo/docs/application/billing.md" >"$tmp_root/no-forward-link.md"
cp "$tmp_root/no-forward-link.md" "$adr_repo/docs/application/billing.md"
if run_verify_capture "$adr_repo" >/dev/null; then
  fail "missing living-document link should fail"
fi
mv "$adr_repo/docs/application/billing.md" "$tmp_root/moved-billing.md"
if run_verify_capture "$adr_repo" >/dev/null; then
  fail "orphan companion should fail"
fi

# Physical author-maintained lines trigger warnings without failing verification.
length_repo="$tmp_root/length-repo"
make_base_docs "$length_repo"
write_doc "$length_repo/docs/application/long.md" "Long document" "Cohesion review fixture."
while [ "$(wc -l <"$length_repo/docs/application/long.md")" -lt 500 ]; do
  printf 'Document content.\n' >>"$length_repo/docs/application/long.md"
done
run_update "$length_repo"
length_output="$(run_verify_capture "$length_repo")" || fail "500 lines should verify"
if printf '%s\n' "$length_output" | grep -q 'WARN:'; then
  fail "500 lines should not warn"
fi
printf 'One more line.\n' >>"$length_repo/docs/application/long.md"
cp "$length_repo/docs/application/long.md" "$length_repo/docs/application/another.md"
run_update "$length_repo"
length_output="$(run_verify_capture "$length_repo")" || fail "length warnings must not fail verification"
for name in long another; do
  printf '%s\n' "$length_output" | grep -q "docs/application/$name.md has 501 lines (recommended maximum: 500)" || fail "warning should identify file and line count"
done
printf '%s\n' "$length_output" | grep -q '0 errors, 2 warning(s)' || fail "length warnings should be counted"
# Reuse a real generated catalog with enough entries to exceed 500 lines.
for number in $(seq 1 501); do
  write_doc "$length_repo/docs/application/item-$number.md" "Item" "Catalog fixture."
done
run_update "$length_repo"
length_output="$(run_verify_capture "$length_repo")" || fail "large generated catalogs should verify"
printf '%s\n' "$length_output" | grep -q '0 errors, 2 warning(s)' || fail "generated catalog lines must not add warnings"

printf 'Docs system script tests passed.\n'
