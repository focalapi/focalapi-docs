import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRepository = process.argv[2] ?? '../focalapi-llm';
const source = resolve(sourceRepository, 'docs/openapi/relay.json');
const destination = resolve(fileURLToPath(new URL('..', import.meta.url)), 'openapi/relay.json');

if (!existsSync(source)) {
  console.error(`未找到上游规范：${source}`);
  console.error('请传入 focalapi-llm 仓库路径，例如：bun run sync:openapi D:/hezh/Gitee/focalapi-llm');
  process.exit(1);
}

copyFileSync(source, destination);

const document = JSON.parse(readFileSync(destination, 'utf8')) as {
  servers?: unknown[];
};
if (!document.servers?.length) {
  document.servers = [
    {
      url: 'https://focalapi.com',
      description: 'FocalAPI 生产环境',
    },
  ];
  writeFileSync(destination, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  console.log('已注入 servers：https://focalapi.com');
}

console.log(`已同步 ${source} -> ${destination}`);
console.log('接着运行 bun run gen:api 重新生成 API 参考页。');
