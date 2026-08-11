import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRepository = process.argv[2] ?? '../focalapi-llm';
const source = resolve(sourceRepository, 'docs/openapi/relay.json');
const destination = resolve(fileURLToPath(new URL('..', import.meta.url)), 'openapi/relay.json');
const creativeDestination = resolve(fileURLToPath(new URL('..', import.meta.url)), 'openapi/creative-relay.json');

const publicCreativeOperations: Record<string, readonly string[]> = {
  '/v1/models': ['get'],
  '/v1beta/models': ['get'],
  '/v1/chat/completions': ['post'],
  '/v1/images/generations': ['post'],
  '/v1/images/edits': ['post'],
  '/api/v3/images/generations': ['post'],
  '/api/v3/contents/generations/tasks': ['post'],
  '/v1/videos': ['post'],
  '/v1/videos/{task_id}': ['get'],
  '/v1/videos/{task_id}/content': ['get'],
  '/kling/v1/videos/text2video': ['post'],
  '/kling/v1/videos/text2video/{task_id}': ['get'],
  '/kling/v1/videos/image2video': ['post'],
  '/kling/v1/videos/image2video/{task_id}': ['get'],
  '/jimeng/': ['post'],
  '/v1/video/generations': ['post'],
  '/v1/video/generations/{task_id}': ['get'],
  '/v1beta/models/{model}:generateContent': ['post'],
  '/v1/audio/transcriptions': ['post'],
  '/v1/audio/translations': ['post'],
  '/v1/audio/speech': ['post'],
};

const editorialOverrides: Record<string, { summary: string; description: string }> = {
  'GET /v1/models': {
    summary: '获取当前 Key 可用模型',
    description: '返回当前 API Key 实际可调用的创作模型和 DeepSeek 备用能力。以返回的模型 ID、控制台模型广场和当前用户分组为准。',
  },
  'GET /v1beta/models': {
    summary: '获取当前 Key 可用 Gemini 模型',
    description: '返回当前 API Key 可调用的 Gemini 模型。以返回的模型 ID 和控制台模型广场为准。',
  },
  'POST /v1/chat/completions': {
    summary: 'DeepSeek 备用对话',
    description: '使用 DeepSeek 完成提示词、分镜、脚本和轻量文本辅助。该接口不是 FocalAPI 的产品主线；请优先使用图像、视频和音频创作接口。',
  },
  'POST /v1/videos': {
    summary: '创建视频任务',
    description: '创建统一视频生成任务。提交后使用返回的任务 ID 查询进度并下载成片。',
  },
  'GET /v1/videos/{task_id}': {
    summary: '查询视频任务',
    description: '查询统一视频生成任务的状态与结果。',
  },
};

if (!existsSync(source)) {
  console.error(`未找到上游规范：${source}`);
  console.error('请传入 focalapi-llm 仓库路径，例如：bun run sync:openapi ../focalapi-llm');
  process.exit(1);
}

copyFileSync(source, destination);

const document = JSON.parse(readFileSync(destination, 'utf8')) as {
  servers?: unknown[];
  paths?: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
};
if (!document.servers?.length) {
  document.servers = [
    {
      url: 'https://api.focalapi.com',
      description: 'FocalAPI 生产环境',
    },
  ];
  writeFileSync(destination, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  console.log('已注入 servers：https://api.focalapi.com');
}

const creativePaths = Object.fromEntries(
  Object.entries(publicCreativeOperations).flatMap(([path, methods]) => {
    const sourcePath = document.paths?.[path];
    if (!sourcePath) return [];

    const operations = Object.fromEntries(
      methods.flatMap((method) => {
        const operation = sourcePath[method];
        if (operation === undefined) return [];
        const override = editorialOverrides[`${method.toUpperCase()} ${path}`];
        return [[method, override ? { ...(operation as Record<string, unknown>), ...override } : operation]];
      }),
    );
    return Object.keys(operations).length === 0 ? [] : [[path, operations]];
  }),
);

writeFileSync(
  creativeDestination,
  `${JSON.stringify({ ...document, paths: creativePaths }, null, 2)}\n`,
  'utf8',
);

console.log(`已同步 ${source} -> ${destination}`);
console.log(`已生成创作接口子集 -> ${creativeDestination}`);
console.log('接着运行 bun run gen:api 重新生成 API 参考页。');
