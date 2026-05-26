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

  domain_index="$domain_dir/index.md"
  domain_docs="$domain_dir/DOCS.md"

  if [ ! -f "$domain_index" ]; then
    error "missing domain index: $domain_index"
  fi

  if [ ! -f "$domain_docs" ]; then
    error "missing domain DOCS protocol: $domain_docs"
  fi

  if [ -f "$docs_dir/index.md" ] && ! contains_required_link "$docs_dir/index.md" "$domain/index.md"; then
    error "docs/index.md does not link domain index: $domain/index.md"
  fi

  while IFS= read -r nested_dir; do
    warn "nested docs directory is outside the two-level layout: $nested_dir"
  done < <(find "$domain_dir" -mindepth 1 -maxdepth 1 -type d ! -name '.*' -print | sort)

  while IFS= read -r leaf_doc; do
    leaf_name="$(basename "$leaf_doc")"
    case "$leaf_name" in
      index.md|DOCS.md) continue ;;
    esac

    if [ -f "$domain_index" ] && ! contains_required_link "$domain_index" "$leaf_name"; then
      error "$domain/index.md does not link subdomain doc: $leaf_name"
    fi
  done < <(find "$domain_dir" -maxdepth 1 -type f -name '*.md' -print | sort)
done < <(find "$docs_dir" -mindepth 1 -maxdepth 1 -type d -print | sort)

if [ "$error_count" -gt 0 ]; then
  printf 'Docs system verification failed: %d error(s), %d warning(s).\n' "$error_count" "$warning_count" >&2
  exit 1
fi

printf 'Docs system verification passed: 0 errors, %d warning(s).\n' "$warning_count"
