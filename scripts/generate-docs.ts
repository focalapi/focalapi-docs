import { generateFiles } from 'fumadocs-openapi';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openapi } from '../src/lib/openapi';

const OUTPUT = './content/docs/api';

// tag 前缀（规范中为中文，含 '/' 层级）→ ASCII 目录名 + 目录展示名
// 注意：目录名必须用 ASCII，避免静态部署时 URL 编码路径在 nginx/Caddy/serve 下 404
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

// relay.json 中存在重复的 operationId（如 createImage），按出现顺序去重文件名
const used = new Map<string, number>();
function uniqueName(base: string) {
  const n = (used.get(base) ?? 0) + 1;
  used.set(base, n);
  return n === 1 ? base : `${base}-${n}`;
}

for (const entry of readdirSync(OUTPUT, { withFileTypes: true })) {
  // API 首页是手写导览；其余内容均由 OpenAPI 生成，必须清理后重建，避免
  // 上游删掉端点后旧文档继续出现在站点与搜索索引中。
  if (entry.isFile() && entry.name === 'index.mdx') continue;
  rmSync(join(OUTPUT, entry.name), { recursive: true, force: true });
}

void generateFiles({
  input: openapi,
  output: OUTPUT,
  per: 'operation',
  // 端点描述直接进 MDX（上游规范描述为中文）
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
  // 后处理 1：根 meta.json 改为「文件夹引用」结构，侧边栏按家族分组折叠
  const rootMeta = {
    title: 'API 参考',
    pages: ['index', ...new Set(Object.values(groups).map((g) => g.dir))],
  };
  writeFileSync(join(OUTPUT, 'meta.json'), JSON.stringify(rootMeta, null, 2) + '\n');

  // 后处理 2：为每个分组目录写 meta.json（带中文标题；无 groupBy 时生成器不会创建）
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
