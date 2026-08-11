import { createOpenAPI } from 'fumadocs-openapi/server';

// note: this is a server-side API
// Synchronize the OpenAPI specification from docs/openapi/ in focalapi-llm; see scripts/sync-openapi.ts.
export const openapi = createOpenAPI({
  input: ['./openapi/creative-relay.json'],
});
