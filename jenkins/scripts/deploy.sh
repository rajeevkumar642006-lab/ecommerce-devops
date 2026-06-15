#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# jenkins/scripts/deploy.sh
#
# Builds Docker images, pushes them to the registry, and restarts the
# containers on the target server via SSH.
#
# Required environment variables:
#   IMAGE_TAG         — Git commit SHA or semantic version
#   DOCKER_REGISTRY   — e.g. docker.io/youruser
#   DEPLOY_HOST       — e.g. ubuntu@192.168.1.100
#   DEPLOY_PATH       — e.g. /opt/ecommerce-devops
#   SSH_KEY_PATH      — path to the SSH private key file
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

IMAGE_TAG="${IMAGE_TAG:-latest}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ecommerce}"
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/ecommerce-devops}"
SSH_KEY_PATH="${SSH_KEY_PATH:-~/.ssh/id_rsa}"

BACKEND_IMAGE="${DOCKER_REGISTRY}/ecommerce-backend:${IMAGE_TAG}"
FRONTEND_IMAGE="${DOCKER_REGISTRY}/ecommerce-frontend:${IMAGE_TAG}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# ── Build images ──────────────────────────────────────────────────────────────
echo "==> Building Docker images (tag: ${IMAGE_TAG})…"
docker build -t "${BACKEND_IMAGE}"  "${ROOT_DIR}/backend"
docker build \
    --build-arg VITE_API_BASE_URL=/api \
    -t "${FRONTEND_IMAGE}" \
    "${ROOT_DIR}/frontend"

# ── Push images ───────────────────────────────────────────────────────────────
echo "==> Pushing images to registry…"
docker push "${BACKEND_IMAGE}"
docker push "${FRONTEND_IMAGE}"

# ── Deploy via SSH ────────────────────────────────────────────────────────────
if [[ -n "${DEPLOY_HOST}" ]]; then
    echo "==> Deploying to ${DEPLOY_HOST}:${DEPLOY_PATH}…"
    ssh -i "${SSH_KEY_PATH}" \
        -o StrictHostKeyChecking=no \
        "${DEPLOY_HOST}" \
        "
        cd ${DEPLOY_PATH} &&
        git pull origin main &&
        IMAGE_TAG=${IMAGE_TAG} docker compose \
            -f docker-compose.yml \
            -f docker-compose.prod.yml \
            up -d --remove-orphans &&
        docker image prune -f
        "
    echo "==> Deployment complete."
else
    echo "==> DEPLOY_HOST not set — skipping remote deployment."
    echo "    Run locally with: docker compose up -d"
fi
