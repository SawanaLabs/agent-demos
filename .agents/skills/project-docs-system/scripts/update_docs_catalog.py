from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

BEGIN_MARKER = "<!-- BEGIN:docs-generated-catalog -->"
END_MARKER = "<!-- END:docs-generated-catalog -->"


class CatalogError(Exception):
    pass


@dataclass(frozen=True)
class DocsTarget:
    repo_root: Path
    docs_dir: Path


def resolve_target(raw_target: str) -> DocsTarget:
    target = Path(raw_target).expanduser()
    if not target.exists() or not target.is_dir():
        raise CatalogError(f"target does not exist or is not a directory: {raw_target}")

    target_abs = target.resolve()
    if (target_abs / "docs").is_dir():
        repo_root = target_abs
        docs_dir = target_abs / "docs"
    elif (
        target_abs.name == "docs"
        or (target_abs / "index.md").is_file()
        or (target_abs / "DOCS.md").is_file()
    ):
        docs_dir = target_abs
        repo_root = docs_dir.parent
    else:
        repo_root = target_abs
        docs_dir = target_abs / "docs"

    if not docs_dir.is_dir():
        raise CatalogError(f"missing docs directory: {docs_dir}")

    return DocsTarget(repo_root=repo_root, docs_dir=docs_dir)


def parse_frontmatter(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0] != "---":
        return {}

    end_index = None
    for index, line in enumerate(lines[1:], start=1):
        if line == "---":
            end_index = index
            break

    if end_index is None:
        return {}

    metadata: dict[str, str] = {}
    for line in lines[1:end_index]:
        match = re.match(r"^\s*([A-Za-z0-9_-]+):\s*(.*?)\s*$", line)
        if not match:
            continue
        key, value = match.groups()
        if (value.startswith('"') and value.endswith('"')) or (
            value.startswith("'") and value.endswith("'")
        ):
            value = value[1:-1]
        metadata[key] = value
    return metadata


def markdown_cell(value: str | None) -> str:
    if value is None:
        return ""
    return " ".join(str(value).split()).replace("|", r"\|")


def display_path(path: Path, base_dir: Path) -> str:
    relative = path.relative_to(base_dir).as_posix()
    if relative.startswith("."):
        return relative
    return f"./{relative}"


def updated_value(metadata: dict[str, str]) -> str:
    for key in ("updateAt", "updatedAt", "lastUpdated", "last_update", "date"):
        value = metadata.get(key)
        if value:
            return value
    return ""


def catalog_docs(base_dir: Path, index_path: Path) -> list[Path]:
    docs: list[Path] = []
    for path in base_dir.rglob("*.md"):
        relative_parts = path.relative_to(base_dir).parts
        if any(part.startswith(".") for part in relative_parts):
            continue
        if path == index_path:
            continue
        docs.append(path)
    return sorted(docs, key=lambda item: item.relative_to(base_dir).as_posix())


def render_catalog(index_path: Path) -> str:
    base_dir = index_path.parent
    rows = [
        BEGIN_MARKER,
        "| File | Title | Description | Updated |",
        "| --- | --- | --- | --- |",
    ]
    for doc_path in catalog_docs(base_dir, index_path):
        metadata = parse_frontmatter(doc_path)
        rows.append(
            "| "
            + " | ".join(
                [
                    markdown_cell(display_path(doc_path, base_dir)),
                    markdown_cell(metadata.get("title")),
                    markdown_cell(metadata.get("description")),
                    markdown_cell(updated_value(metadata)),
                ]
            )
            + " |"
        )
    rows.append(END_MARKER)
    return "\n".join(rows)


def replace_catalog_block(text: str, block: str, path: Path) -> str:
    begin_count = text.count(BEGIN_MARKER)
    end_count = text.count(END_MARKER)
    if begin_count == 0 and end_count == 0:
        prefix = text.rstrip()
        separator = "\n\n" if prefix else ""
        return f"{prefix}{separator}{block}\n"

    if begin_count != 1 or end_count != 1:
        raise CatalogError(
            f"invalid generated docs catalog markers in {path}: expected one begin marker and one end marker"
        )

    begin_index = text.index(BEGIN_MARKER)
    end_index = text.index(END_MARKER)
    if begin_index > end_index:
        raise CatalogError(f"invalid generated docs catalog marker order in {path}")

    end_after = end_index + len(END_MARKER)
    if end_after < len(text) and text[end_after] == "\n":
        end_after += 1
    return f"{text[:begin_index]}{block}\n{text[end_after:]}"


def index_files(docs_dir: Path) -> list[Path]:
    root_index = docs_dir / "index.md"
    if not root_index.is_file():
        raise CatalogError(f"missing required file: {root_index}")

    indexes: list[Path] = []
    for path in docs_dir.rglob("index.md"):
        relative_parts = path.relative_to(docs_dir).parts
        if any(part.startswith(".") for part in relative_parts):
            continue
        indexes.append(path)

    return sorted(indexes, key=lambda item: item.relative_to(docs_dir).as_posix())


def expected_content(index_path: Path) -> str:
    current = index_path.read_text(encoding="utf-8")
    return replace_catalog_block(current, render_catalog(index_path), index_path)


def check_catalog(target: DocsTarget) -> int:
    stale: list[Path] = []
    for index_path in index_files(target.docs_dir):
        current = index_path.read_text(encoding="utf-8")
        if expected_content(index_path) != current:
            stale.append(index_path)

    if not stale:
        print("Docs catalog is up to date.")
        return 0

    script_dir = Path(__file__).resolve().parent
    update_script = script_dir / "update-docs-catalog.sh"
    verify_script = script_dir / "verify-docs-system.sh"
    for path in stale:
        print(f"ERROR: generated docs catalog is stale: {path}", file=sys.stderr)
    print(file=sys.stderr)
    print(
        "The docs catalog is generated from Markdown frontmatter and must match the current docs tree.",
        file=sys.stderr,
    )
    print("Run:", file=sys.stderr)
    print(f"  {update_script} {target.repo_root}", file=sys.stderr)
    print("Then rerun:", file=sys.stderr)
    print(f"  {verify_script} {target.repo_root}", file=sys.stderr)
    return 1


def write_catalog(target: DocsTarget) -> int:
    changed: list[Path] = []
    for index_path in index_files(target.docs_dir):
        current = index_path.read_text(encoding="utf-8")
        expected = expected_content(index_path)
        if expected == current:
            continue
        index_path.write_text(expected, encoding="utf-8")
        changed.append(index_path)

    if changed:
        for path in changed:
            print(f"Updated generated docs catalog: {path}")
    else:
        print("Docs catalog is already up to date.")
    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Update or check generated docs catalog blocks in docs index files."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="check generated catalog blocks without writing files",
    )
    parser.add_argument(
        "target",
        nargs="?",
        default=".",
        help="repository root or docs directory",
    )
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    try:
        target = resolve_target(args.target)
        if args.check:
            return check_catalog(target)
        return write_catalog(target)
    except CatalogError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
