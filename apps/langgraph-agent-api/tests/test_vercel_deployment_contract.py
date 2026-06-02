import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ENTER_API_ROOT_COMMAND = (
    "if [ -d apps/langgraph-agent-api ]; then cd apps/langgraph-agent-api; fi"
)
VERCEL_UV_INSTALL_COMMAND = (
    f"{ENTER_API_ROOT_COMMAND}; uv sync --active --frozen --no-dev"
)
VERCEL_UV_BUILD_COMMAND = (
    f"{ENTER_API_ROOT_COMMAND}; "
    "uv run --active --frozen --no-dev python -c 'from app import app'"
)


def test_vercel_deployment_uses_uv_lock_as_the_dependency_contract() -> None:
    vercel_config = json.loads((PROJECT_ROOT / "vercel.json").read_text())

    assert vercel_config["framework"] == "fastapi"
    assert vercel_config["installCommand"] == VERCEL_UV_INSTALL_COMMAND
    assert vercel_config["buildCommand"] == VERCEL_UV_BUILD_COMMAND
    assert (PROJECT_ROOT / "pyproject.toml").is_file()
    assert (PROJECT_ROOT / "uv.lock").is_file()
    assert not (PROJECT_ROOT / "requirements.txt").exists()


def test_vercel_deployment_excludes_root_workspace_detection_files() -> None:
    ignore_entries = {
        line.strip()
        for line in (PROJECT_ROOT / ".vercelignore").read_text().splitlines()
        if line.strip() and not line.startswith("#")
    }

    assert {
        "package.json",
        "pnpm-lock.yaml",
        "pnpm-workspace.yaml",
        "turbo.json",
        "apps/web",
        "packages",
    }.issubset(ignore_entries)


def test_preprod_build_script_exports_uv_managed_python_for_vercel_builder() -> None:
    script = PROJECT_ROOT / "scripts" / "preprod-vercel-build.sh"
    script_text = script.read_text()

    assert "uv python install \"$python_version\"" in script_text
    assert "uv python find \"$python_version\"" in script_text
    assert "export PATH=\"$python_bin_dir:$PATH\"" in script_text
    assert "cp \"$api_project_json\" \"$root_project_json\"" in script_text
    assert "cp \"$backup_project_json\" \"$root_project_json\"" in script_text
    assert "vercel build --prod --yes" in script_text
