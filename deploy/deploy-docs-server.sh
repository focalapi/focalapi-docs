#!/usr/bin/env bash
# Build and deploy the documentation site on the server. This replaced local deploy-docs.ps1 on 2026-08-07.
# Local Docker Desktop is no longer used; the server pulls docker.io quickly and reuses cached base layers.
# Usage: ./deploy/deploy-docs-server.sh [commit]
# Prerequisite: the commit must be pushed; the script verifies that an origin branch contains it.
set -Eeuo pipefail

HOST="${FOCALAPI_DOCS_HOST:-root@104.36.65.33}"
IDENTITY="${FOCALAPI_DOCS_IDENTITY:-$HOME/.ssh/focalapi_ed25519}"
COMMIT="${1:-$(git rev-parse --short=12 HEAD)}"

if ! git cat-file -e "${COMMIT}^{commit}" 2>/dev/null; then
  echo "Unknown commit: ${COMMIT}" >&2
  exit 1
fi
if ! git branch -r --contains "${COMMIT}" | grep -q origin; then
  echo "Commit ${COMMIT} has not been pushed yet; run git push first." >&2
  exit 1
fi

VERSION="$(date -u +%Y%m%d%H%M%S)-${COMMIT}"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

git archive --format=tar --prefix=docs-src/ "${COMMIT}" | gzip -1 > "${TMP}/docs.tgz"
ls -la "${TMP}/docs.tgz"
scp -q -i "${IDENTITY}" "${TMP}/docs.tgz" "${HOST}:/tmp/focalapi-docs.tgz"

ssh -i "${IDENTITY}" "${HOST}" "
  set -Eeuo pipefail
  mkdir -p /opt/focalapi-docs
  rm -rf /opt/focalapi-docs/src /opt/focalapi-docs/docs-src
  tar -xzf /tmp/focalapi-docs.tgz -C /opt/focalapi-docs && rm -f /tmp/focalapi-docs.tgz
  mv /opt/focalapi-docs/docs-src /opt/focalapi-docs/src
  cd /opt/focalapi-docs/src
  echo '==> Building focalapi-docs:${VERSION} on the server...'
  docker build --platform linux/amd64 -t focalapi-docs:${VERSION} .
  docker tag focalapi-docs:${VERSION} focalapi-docs:latest
  compose_file=/opt/focalapi-llm/current/deploy/focalapi-llm/docker-compose.prod.yml
  if ! grep -q 'image: focalapi-docs:latest' \"\${compose_file}\"; then
    sed -i 's|image: focalapi-docs@sha256:[a-f0-9]*|image: focalapi-docs:latest|' \"\${compose_file}\"
  fi
  echo '==> Deploying docs service...'
  docker compose -p focalapi-llm --env-file /opt/focalapi-llm/.env -f \"\${compose_file}\" up -d docs
  healthy=0
  for _ in \$(seq 1 20); do
    if curl -fsS http://127.0.0.1:3001/zh/docs 2>/dev/null | grep -q FocalAPI; then healthy=1; break; fi
    sleep 3
  done
  if [[ \${healthy} -ne 1 ]]; then
    echo 'docs 健康检查失败' >&2
    docker compose -p focalapi-llm --env-file /opt/focalapi-llm/.env -f \"\${compose_file}\" logs --tail 50 docs >&2 || true
    exit 1
  fi
  echo 'Deployment complete: focalapi-docs:'${VERSION}' healthy on :3001.'
"
