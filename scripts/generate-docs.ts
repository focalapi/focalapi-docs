import { generateFiles } from 'fumadocs-openapi';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openapi } from '../src/lib/openapi';

const OUTPUT = './content/docs/api';

// Map tag prefixes, which may contain Chinese text and slash hierarchy, to ASCII directory names and display labels.
// Directory names must remain ASCII to avoid encoded-path 404s under Nginx, Caddy, or serve after static deployment.
const groups: Record<string, { dir: string; title: string }> = {
  获取模型列表: { dir: 'models', title: '可用模型' },
  'OpenAI格式(Chat)': { dir: 'deepseek', title: 'DeepSeek 对话（备用）' },
  图片生成: { dir: 'images', title: '图像创作' },
  视频生成: { dir: 'video', title: '视频创作' },
  'OpenAI音频(Audio)': { dir: 'audio', title: '音频创作' },
  Gemini格式: { dir: 'gemini-image', title: 'Gemini 图像原生接口' },
};

function groupOf(tags: string[] | undefined) {
  const tag = tags?.[0] ?? '';
  const prefix = tag.split('/')[0];
  return groups[prefix] ?? { dir: 'misc', title: '其他' };
}

// relay.json may contain duplicate operationId values such as createImage; deduplicate filenames by encounter order.
const used = new Map<string, number>();
function uniqueName(base: string) {
  const n = (used.get(base) ?? 0) + 1;
  used.set(base, n);
  return n === 1 ? base : `${base}-${n}`;
}

for (const entry of readdirSync(OUTPUT, { withFileTypes: true })) {
  // The API landing page is handwritten. Rebuild all other content from OpenAPI after cleanup
  // so removed upstream endpoints do not remain in the site or search index.
  if (entry.isFile() && entry.name === 'index.mdx') continue;
  rmSync(join(OUTPUT, entry.name), { recursive: true, force: true });
}

void generateFiles({
  input: openapi,
  output: OUTPUT,
  per: 'operation',
  // Endpoint descriptions enter MDX directly and may be Chinese in the upstream specification.
  includeDescription: true,
  meta: true,
  name(output) {
    if (output.type !== 'operation') return output.item.name;

    const doc = this.document;
    const operation = doc.paths?.[output.item.path]?.[output.item.method];
    const opId = operation?.operationId ?? output.item.path;
    const { dir } = groupOf(operation?.tags);
    return `${dir}/${uniqueName(opId)}`;
  },
}).then(() => {
  // Post-process 1: use folder references in the root meta.json so the sidebar groups endpoint families.
  const rootMeta = {
    title: 'API 参考',
    pages: ['index', ...new Set(Object.values(groups).map((g) => g.dir))],
  };
  writeFileSync(join(OUTPUT, 'meta.json'), JSON.stringify(rootMeta, null, 2) + '\n');

  // Post-process 2: write meta.json for every group directory; the generator omits it without groupBy.
  const seen = new Set<string>();
  for (const { dir, title } of Object.values(groups)) {
    if (seen.has(dir)) continue;
    seen.add(dir);
    const metaPath = join(OUTPUT, dir, 'meta.json');
    if (!existsSync(metaPath)) {
      writeFileSync(metaPath, JSON.stringify({ title }, null, 2) + '\n');
      continue;
    }
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8')) as Record<string, unknown>;
    if (meta.title === undefined) {
      meta.title = title;
      writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
    }
  }
  console.log('meta.json 已重组并补齐标题');
});
