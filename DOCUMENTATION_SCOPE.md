# FocalAPI documentation scope

FocalAPI is a model gateway for creative workflows. Documentation, the home page, navigation, examples, and API references must prioritize image, video, audio, 3D, and other visual-creation capabilities.

## Fixed product boundary

- Promote and fully document image, video, audio, 3D, and visual models that support creative work.
- Treat DeepSeek as a fallback for general text work; do not present it as the main product workflow.
- Do not promote OpenAI, Claude, Claude Code, coding models, general chat models, embeddings, reranking, search, Realtime, Files, or fine-tuning as primary user-facing features or navigation entries.
- An endpoint appearing in the upstream OpenAPI specification does not imply that it belongs in the public documentation. `publicCreativeOperations` in `scripts/sync-openapi.ts` is the only allowlist for the public API reference.
- Before adding documentation, confirm that it supports the creative-product focus. Content outside this boundary must not enter site navigation, the home page, examples, or the search index.

When adding a creative model or endpoint, update the product-scope page, the relevant guide, and the allowlist together. Use actual available model IDs and official native request semantics.
