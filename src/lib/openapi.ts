import { createOpenAPI } from 'fumadocs-openapi/server';

// note: this is a server-side API
// OpenAPI 规范从 focalapi-llm 仓库 docs/openapi/ 同步（见 scripts/sync-openapi.sh）
export const openapi = createOpenAPI({
  input: ['./openapi/relay.json'],
});
