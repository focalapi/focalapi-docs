# FocalAPI 文档站

FocalAPI 的用户文档站，基于 [Fumadocs](https://fumadocs.dev)（Next.js 16 + 静态导出），中文为主、英文为辅，API 参考由 OpenAPI 规范自动生成。

- 线上内容对应主仓库：[focalapi-llm](https://gitee.com/xnn-ai/focalapi-llm)
- 站点：构建产物为纯静态文件（`out/`），可部署到任意静态托管 / VPS + Caddy / Nginx

## 常用命令

```bash
bun install          # 安装依赖
bun run dev          # 本地开发（热更新）
bun run build        # 静态构建到 out/
bun run start        # 本地预览构建产物
bun run sync:openapi # 从 ../focalapi-llm 同步 OpenAPI 规范（可传仓库路径）
bun run gen:api      # 从 openapi/relay.json 生成 API 参考页
bun run types:check  # 类型检查
```

## 内容结构

```
content/docs/
├── index.mdx / index.en.mdx        # 首页（zh 默认 + en 翻译，点式文件名约定）
├── quickstart.mdx / .en.mdx        # 快速开始
├── authentication.mdx / .en.mdx    # 认证
├── billing.mdx / .en.mdx           # 计费与额度
├── guides/                         # 使用指南（按任务场景）
│   ├── meta.json / meta.en.json    # 目录标题与排序（双语）
│   └── chat / images / video-tasks / search（各含 .en.mdx）
├── api/                            # ⚠️ 大部分由 gen:api 生成，勿手改生成文件
│   ├── index.mdx                   # 手写：API 参考首页（生成器不会覆盖）
│   └── <分组>/<operation>.mdx      # 生成：每个端点一页
├── deployment.mdx / .en.mdx        # 部署运维
└── errors.mdx / .en.mdx            # 错误码
```

### 多语言约定

- 默认语言简体中文：`page.mdx`；英文翻译：`page.en.mdx`（同目录点式命名）
- 目录标题/排序：目录下 `meta.json`（中文）、`meta.en.json`（英文）
- 没有英文版的页面在英文站自动回退到中文内容
- 侧边栏语言切换、UI 文案（含 API 组件）已由 `@fumadocs/language` 官方简中包覆盖

## OpenAPI 规范同步工作流

API 参考页的**唯一事实来源**是主仓库的 `docs/openapi/relay.json`：

```bash
bun run sync:openapi   # 1. 拷贝规范到 openapi/relay.json，并注入 servers（focalapi.com）
bun run gen:api        # 2. 重新生成 content/docs/api/ 下的端点页与 meta.json
bun run build          # 3. 验证构建
```

注意事项：

- **不要手改** `content/docs/api/<分组>/*.mdx`（文件头有 generated 标记），改动会被重新生成覆盖
- `content/docs/api/index.mdx` 是手写页，生成器不会动它
- 分组目录与标题在 `scripts/generate-docs.ts` 的 `groups` 映射里维护（中文 tag → ASCII 目录）
- 上游规范若新增 tag，需要在该映射里补一行，否则落入 `misc` 分组
- 上游规范存在重复的 `operationId`（如 `createImage`），生成脚本会自动加 `-2` 后缀去重；根本解法是在上游规范里改成唯一 operationId

## 部署

### Docker（生产，与 focalapi-llm 同机）

镜像为「bun 构建静态产物 + Caddy 静态服务」的多阶段构建，服务器只导入镜像不编译：

```powershell
# 本机（Windows + Docker Desktop，密钥 ~/.ssh/focalapi_ed25519）
.\deploy\deploy-docs.ps1
```

脚本流程：buildx 构建 `linux/amd64` 镜像 → 导出压缩 → 上传到服务器 `/tmp` → 远端 `remote-deploy-docs.sh` 导入镜像、并入 `focalapi-llm` compose 项目（`docs` 服务，宿主端口 `${DOCS_PORT:-3001}`）→ 健康检查 `/zh/docs`。

- compose 服务定义在 focalapi-llm 仓 `deploy/focalapi-llm/docker-compose.prod.yml`；**首次发布需先跑过一次 app 部署**（服务器 `/opt/focalapi-llm/current` 里的 compose 含 docs 服务）
- 公网访问：反向代理站点 `docs.focalapi.com → 127.0.0.1:3001` + DNS A 记录指向服务器；Caddy 配置示例见 focalapi-llm 部署 README
- 主站经原生设置 `general_setting.docs_link` 链接到文档站（默认 `https://docs.focalapi.com`；存量数据库需在管理后台改一次）
- 回滚：`docker tag focalapi-docs:<旧版本> focalapi-docs:latest` 后 `up -d docs`

### 纯静态（任意托管）

`bun run build` 输出纯静态文件到 `out/`。Caddy 示例：

```txt
docs.focalapi.com {
    root * /var/www/focalapi-docs
    file_server
    try_files {path} {path}.html {path}/index.html
}
```

- 部署前把 `src/app/layout.tsx` 里的 `metadataBase` 改成正式域名
- 根路径 `/` 按浏览器语言跳转 `/zh` 或 `/en`
- `/docs` 与 `/docs/<页面路径>` 是**语言无关深链**：按浏览器语言跳转到对应语言版本（供主站页脚等外部链接使用；静态导出的客户端跳转，非服务端 301）

## 已知说明

- 站内搜索为构建时静态索引（Orama 多语言分词，中文零配置），随 `build` 更新
- 代码示例里的服务器地址来自规范的 `servers`；SSR HTML 中为 `example.com` 占位，页面水合后替换为真实地址（框架行为，非 bug）
- `/v1/alpha/search` 搜索接口暂未收录进 OpenAPI 规范，用法见「使用指南 → 搜索」手写页
