---
name: deploy-focalapi-docs
description: Deploy, roll back, and verify the FocalAPI static documentation site. Use when the user explicitly asks to publish, deploy, release, or verify focalapi-docs in production.
---

# Deploy FocalAPI Docs

Deploy only after the user explicitly authorizes production work. The current path is server-side image construction through `deploy/deploy-docs-server.sh`; do not restore the retired local Docker workflow.

## Before deployment

1. Work from `D:\hezh\Gitee\focalapi\focalapi-docs`; inspect `git status --short`, `git diff --check`, and the target commit. Keep unrelated changes out of the release.
2. When the platform OpenAPI contract changed, regenerate the API reference before validating:

   ```powershell
   bun run sync:openapi D:/hezh/Gitee/focalapi
   bun run gen:api
   ```

   Do not hand-edit generated files under `content/docs/api/`. Keep the change within `DOCUMENTATION_SCOPE.md` and `publicCreativeOperations`.
3. Validate the docs release:

   ```powershell
   bun run types:check
   bun run build
   ```

4. Commit and push the exact release commit. The deployment script rejects commits absent from an `origin` remote branch.

## Release

```bash
./deploy/deploy-docs-server.sh [commit]
```

The script archives and uploads source, builds `focalapi-docs:<version>` on the server, updates the docs service in the current FocalAPI compose deployment, and checks `http://127.0.0.1:3001/zh/docs` remotely. Use its exit status as the deployment result.

Do not change DNS, shared reverse-proxy configuration, production environment files, or unrelated compose services without separate authorization.

## Verify and report

- Confirm the script's health check passed and the target docs page is reachable externally when that authorization was given.
- Verify both Chinese and English pages, changed API references, and search results when relevant.
- On failure, inspect the docs service logs through the production compose file; do not retry blindly.
- Report the commit, validation commands, release result, health result, and any skipped external verification.
