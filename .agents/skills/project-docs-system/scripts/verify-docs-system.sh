#!/usr/bin/env bash
set -u

usage() {
  cat <<'EOF'
Usage: verify-docs-system.sh [repo-root-or-docs-dir]

Verify the minimum structural contract for a project docs system.
Accepts either a repository root containing docs/ or the docs/ directory itself.
EOF
}

error_count=0
warning_count=0
script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)"

error() {
  printf 'ERROR: %s\n' "$*" >&2
  error_count=$((error_count + 1))
}

warn() {
  printf 'WARN: %s\n' "$*" >&2
  warning_count=$((warning_count + 1))
}

has_frontmatter() {
  file="$1"
  first_line="$(sed -n '1p' "$file")"
  [ "$first_line" = "---" ] || return 1
  awk 'NR > 1 && $0 == "---" { found = 1; exit } END { exit found ? 0 : 1 }' "$file"
}

contains_required_link() {
  file="$1"
  needle="$2"
  [ -f "$file" ] && grep -Fq "$needle" "$file"
}

has_markdown_tree() {
  dir="$1"
  [ -n "$(find "$dir" -type f -name '*.md' ! -path '*/.*/*' -print | sed -n '1p')" ]
}

verify_index_covers_scope() {
  scope_dir="$1"
  index_file="$scope_dir/index.md"

  if [ ! -f "$index_file" ]; then
    error "missing docs index: $index_file"
    return
  fi

  while IFS= read -r leaf_doc; do
    leaf_name="$(basename "$leaf_doc")"
    case "$leaf_name" in
      index.md|DOCS.md) continue ;;
    esac

    if ! contains_required_link "$index_file" "$leaf_name"; then
      error "$index_file does not link direct docs file: $leaf_name"
    fi
  done < <(find "$scope_dir" -maxdepth 1 -type f -name '*.md' -print | sort)

  while IFS= read -r child_dir; do
    child_name="$(basename "$child_dir")"
    case "$child_name" in
      .*) continue ;;
    esac

    if ! has_markdown_tree "$child_dir"; then
      continue
    fi

    if ! contains_required_link "$index_file" "$child_name/index.md"; then
      error "$index_file does not link child docs index: $child_name/index.md"
    fi
  done < <(find "$scope_dir" -mindepth 1 -maxdepth 1 -type d -print | sort)
}

verify_docs_scope_recursive() {
  scope_dir="$1"

  if ! has_markdown_tree "$scope_dir"; then
    return
  fi

  verify_index_covers_scope "$scope_dir"

  while IFS= read -r child_dir; do
    child_name="$(basename "$child_dir")"
    case "$child_name" in
      .*) continue ;;
    esac
    verify_docs_scope_recursive "$child_dir"
  done < <(find "$scope_dir" -mindepth 1 -maxdepth 1 -type d -print | sort)
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

if [ "$#" -gt 1 ]; then
  usage >&2
  exit 2
fi

target="${1:-.}"

if [ ! -d "$target" ]; then
  error "target does not exist or is not a directory: $target"
  exit 1
fi

target_abs="$(cd "$target" && pwd -P)"

if [ -d "$target_abs/docs" ]; then
  repo_root="$target_abs"
  docs_dir="$target_abs/docs"
elif [ "$(basename "$target_abs")" = "docs" ] || [ -f "$target_abs/index.md" ] || [ -f "$target_abs/DOCS.md" ]; then
  docs_dir="$target_abs"
  repo_root="$(cd "$docs_dir/.." && pwd -P)"
else
  repo_root="$target_abs"
  docs_dir="$target_abs/docs"
fi

if [ ! -d "$docs_dir" ]; then
  error "missing docs directory: $docs_dir"
  exit 1
fi

printf 'Verifying docs system: %s\n' "$docs_dir"

if [ -d "$repo_root/.docs" ]; then
  error "legacy .docs directory exists at $repo_root/.docs"
fi

if [ ! -f "$docs_dir/index.md" ]; then
  error "missing required file: $docs_dir/index.md"
fi

if [ ! -f "$docs_dir/DOCS.md" ]; then
  error "missing required file: $docs_dir/DOCS.md"
fi

while IFS= read -r md_file; do
  if ! has_frontmatter "$md_file"; then
    error "missing frontmatter: $md_file"
  fi
done < <(find "$docs_dir" -type f -name '*.md' -print | sort)

while IFS= read -r line; do
  error "forbidden legacy docs path reference: $line"
done < <(find "$docs_dir" -type f -name '*.md' -exec grep -nE '(^|[^[:alnum:]_])\.docs(/|[^[:alnum:]_]|$)|domains/DOCS\.md' {} + 2>/dev/null)

while IFS= read -r root_md; do
  name="$(basename "$root_md")"
  case "$name" in
    index.md|DOCS.md) ;;
    *) warn "root-level docs markdown is outside the canonical layout: $root_md" ;;
  esac
done < <(find "$docs_dir" -mindepth 1 -maxdepth 1 -type f -name '*.md' -print | sort)

while IFS= read -r domain_dir; do
  domain="$(basename "$domain_dir")"
  case "$domain" in
    .*) continue ;;
  esac

  domain_docs="$domain_dir/DOCS.md"

  if ! has_markdown_tree "$domain_dir"; then
    continue
  fi

  if [ ! -f "$domain_docs" ]; then
    error "missing domain DOCS protocol: $domain_docs"
  fi
done < <(find "$docs_dir" -mindepth 1 -maxdepth 1 -type d -print | sort)

verify_docs_scope_recursive "$docs_dir"

if [ "$error_count" -eq 0 ]; then
  catalog_script="$script_dir/update-docs-catalog.sh"
  if [ ! -x "$catalog_script" ]; then
    error "missing executable docs catalog updater: $catalog_script"
  elif ! "$catalog_script" --check "$target_abs"; then
    error "generated docs catalog check failed"
  fi
fi

if [ "$error_count" -gt 0 ]; then
  printf 'Docs system verification failed: %d error(s), %d warning(s).\n' "$error_count" "$warning_count" >&2
  exit 1
fi

printf 'Docs system verification passed: 0 errors, %d warning(s).\n' "$warning_count"
