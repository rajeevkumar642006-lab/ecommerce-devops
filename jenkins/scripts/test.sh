#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# jenkins/scripts/test.sh
#
# Runs the backend test suite.  Requires MONGO_URI and JWT_SECRET to be set
# (or uses the defaults below for local/CI use).
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# ── Environment defaults for CI ───────────────────────────────────────────────
export MONGO_URI="${MONGO_URI:-mongodb://localhost/ecommerce_test}"
export JWT_SECRET="${JWT_SECRET:-ci_test_secret_key_minimum_32_chars_long}"
export NODE_ENV="test"

echo "==> Running backend tests…"
cd "${ROOT_DIR}/backend"
npm test -- --forceExit --passWithNoTests

echo ""
echo "==> All tests passed."
