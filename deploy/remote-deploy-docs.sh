#!/usr/bin/env bash
# FocalAPI 文档站服务器端安装：导入镜像 -> 标记 latest -> 并入 focalapi-llm compose 项目
# 参数: <image_archive_path> <version>
set -Eeuo pipefail

image_archive_path="${1:-}"
version="${2:-}"

if [[ ! -f ${image_archive_path} ]]; then
  echo "镜像包不存在: ${image_archive_path}" >&2
  exit 1
fi

if [[ ! ${version} =~ ^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$ ]]; then
  echo "非法版本号: ${version}" >&2
  exit 1
fi

cleanup_archive() {
  rm -f -- "${image_archive_path}"
}
trap cleanup_archive EXIT

llm_root="/opt/focalapi-llm"
env_file="${llm_root}/.env"
compose_file="${llm_root}/current/deploy/focalapi-llm/docker-compose.prod.yml"

if [[ ! -f ${compose_file} ]]; then
  echo "找不到 app 发布的 compose 文件: ${compose_file}" >&2
  echo "请先执行一次 app 部署（focalapi-llm/deploy/focalapi-llm/deploy.ps1）" >&2
  exit 1
fi

if ! grep -q '^  docs:' "${compose_file}"; then
  echo "当前 app 发布的 compose 不含 docs 服务（旧版本）" >&2
  echo "请先用包含 docs 服务的 focalapi-llm 分支执行一次 app 部署，再重试" >&2
  exit 1
fi

echo "导入镜像 focalapi-docs:${version}..."
docker load -i "${image_archive_path}"
docker tag "focalapi-docs:${version}" "focalapi-docs:latest"

echo "启动/更新 docs 服务..."
docker compose -p focalapi-llm --env-file "${env_file}" \
  -f "${compose_file}" up -d docs

# 健康检查：/zh/docs 返回且包含站点标识
docs_port="$(grep -E '^DOCS_PORT=' "${env_file}" 2>/dev/null | cut -d= -f2 || true)"
docs_port="${docs_port:-3001}"
healthy=0
for _ in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:${docs_port}/zh/docs" 2>/dev/null | grep -q FocalAPI; then
    healthy=1
    break
  fi
  sleep 3
done

if [[ ${healthy} -ne 1 ]]; then
  echo "docs 服务健康检查失败（http://127.0.0.1:${docs_port}/zh/docs）" >&2
  docker compose -p focalapi-llm --env-file "${env_file}" \
    -f "${compose_file}" logs --tail 50 docs >&2 || true
  exit 1
fi

echo "docs 服务已就绪: http://127.0.0.1:${docs_port}/zh/docs （版本 ${version}）"
echo "公网访问需反向代理站点 docs.focalapi.com -> 127.0.0.1:${docs_port} 及对应 DNS 记录"
