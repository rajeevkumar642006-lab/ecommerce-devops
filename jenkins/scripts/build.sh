#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# jenkins/scripts/build.sh
#
# Called by the Jenkins pipeline to install dependencies and build both
# the backend and frontend.  Can also be run locally for a quick sanity check.
#
# Usage:
#   chmod +x jenkins/scripts/build.sh
#   ./jenkins/scripts/build.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail   # exit on error, undefined variable, or pipe failure

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "==> Project root: ${ROOT_DIR}"

# ── Backend ───────────────────────────────────────────────────────────────────
echo ""
echo "==> [1/2] Installing backend dependencies…"
cd "${ROOT_DIR}/backend"
npm ci
echo "    Backend dependencies installed."

# ── Frontend ──────────────────────────────────────────────────────────────────
echo ""
echo "==> [2/2] Installing and building frontend…"
cd "${ROOT_DIR}/frontend"
npm ci
VITE_API_BASE_URL=/api npm run build
echo "    Frontend built → dist/"

echo ""
echo "==> Build complete."
