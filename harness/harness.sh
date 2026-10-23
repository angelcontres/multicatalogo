#!/usr/bin/env bash
# MultiCatálogo AI Harness Shell Wrapper
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_PY="$SCRIPT_DIR/ai_harness.py"

if ! command -v python3 &>/dev/null && ! command -v python &>/dev/null; then
    echo "Error: Python is required to run the AI Harness." >&2
    exit 1
fi

PYTHON_BIN="python3"
if ! command -v python3 &>/dev/null; then
    PYTHON_BIN="python"
fi

$PYTHON_BIN "$HARNESS_PY" "${@:-doctor}"
