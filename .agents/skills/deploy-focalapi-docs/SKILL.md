---
name: deploy-focalapi-docs
description: Build, release, deploy, roll back, and verify the FocalAPI static documentation site. Use when changing focalapi-docs content, OpenAPI reference pages, Docker deployment files, or the production docs service.
---

# Deploy FocalAPI Docs

Deploy the static Fumadocs site to the same production host as `focalapi-llm`. The local Windows machine builds the `linux/amd64` image; the server only imports and runs it.

## Release workflow

1. Work from the `focalapi-docs` repository root and inspect `git status --short`. Do not deploy unrelated or unreviewed changes.
2. When the upstream API contract changed, run:

   ```powershell
   bun run sync:openapi D:/hezh/Gitee/focalapi-llm
   bun run gen:api
   ```

   Do not manually edit generated files under `content/docs/api/`.
3. Validate the release before deploying:

   ```powershell
   bun run types:check
   bun run build
   ```

4. For the first release, ensure the target server's deployed `focalapi-llm` compose file already contains the `docs` service from `deploy/focalapi-llm/docker-compose.prod.yml`. Deploy that application configuration first if it is missing.
5. Build, upload, import, start, and health-check the docs service:

   ```powershell
   .\deploy\deploy-docs.ps1
   ```

   The script pulls base images through `docker.m.daocloud.io/` by default (override with `-ImageRegistry`), creates a versioned `focalapi-docs` image, uploads it to the configured server, starts `docs`, and checks `http://127.0.0.1:${DOCS_PORT:-3001}/zh/docs` remotely.
6. Verify externally only after the host reverse proxy and DNS map `docs.focalapi.com` to `127.0.0.1:3001`. Do not change DNS or a shared reverse-proxy configuration without explicit authorization.

## Safety and cleanup

- The deployment script removes its temporary archives, release image, and Buildx cache by default to avoid exhausting Docker Desktop storage on `C:`. Use `-KeepLocalBuildArtifacts` only while diagnosing a build.
- The service is static-only and should expose container port `80` through `${DOCS_PORT:-3001}`; do not add a server-side Node process.
- Confirm `docker compose ... ps docs` and the health endpoint after a release. Inspect `docker compose ... logs --tail 100 docs` on failure.
- To roll back, retag a previously imported `focalapi-docs:<version>` as `focalapi-docs:latest`, then run `docker compose ... up -d docs` with the production compose file.

[TODO: Add content here. See examples in existing skills:
- Code samples for technical skills
- Decision trees for complex workflows
- Concrete examples with realistic user requests
- References to scripts/templates/references as needed]

## Resources (optional)

Create only the resource directories this skill actually needs. Delete this section if no resources are required.

### scripts/
Executable code (Python/Bash/etc.) that can be run directly to perform specific operations.

**Examples from other skills:**
- PDF skill: `fill_fillable_fields.py`, `extract_form_field_info.py` - utilities for PDF manipulation
- DOCX skill: `document.py`, `utilities.py` - Python modules for document processing

**Appropriate for:** Python scripts, shell scripts, or any executable code that performs automation, data processing, or specific operations.

**Note:** Scripts may be executed without loading into context, but can still be read by Codex for patching or environment adjustments.

### references/
Documentation and reference material intended to be loaded into context to inform Codex's process and thinking.

**Examples from other skills:**
- Product management: `communication.md`, `context_building.md` - detailed workflow guides
- BigQuery: API reference documentation and query examples
- Finance: Schema documentation, company policies

**Appropriate for:** In-depth documentation, API references, database schemas, comprehensive guides, or any detailed information that Codex should reference while working.

### assets/
Files not intended to be loaded into context, but rather used within the output Codex produces.

**Examples from other skills:**
- Brand styling: PowerPoint template files (.pptx), logo files
- Frontend builder: HTML/React boilerplate project directories
- Typography: Font files (.ttf, .woff2)

**Appropriate for:** Templates, boilerplate code, document templates, images, icons, fonts, or any files meant to be copied or used in the final output.

---

**Not every skill requires all three types of resources.**
