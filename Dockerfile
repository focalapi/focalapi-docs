# FocalAPI 文档站镜像：本地构建 linux/amd64，上传服务器后直接运行（服务器不编译）
# 注意：base 镜像从 Docker Hub 拉取；本机网络不通时先经镜像站拉取并 retag
# （docker pull docker.m.daocloud.io/oven/bun:1 && docker tag docker.m.daocloud.io/oven/bun:1 oven/bun:1）

ARG IMAGE_REGISTRY=
FROM ${IMAGE_REGISTRY}oven/bun:1 AS build
WORKDIR /app

# 依赖层（锁文件不变即命中缓存）
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 源码与内容（openapi/relay.json 在构建期被 createOpenAPI 读取）
COPY . .
RUN bun run build

FROM ${IMAGE_REGISTRY}caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/out /srv
EXPOSE 80
