import { source } from '@/lib/source';
import { Redirector } from '../redirector';

// 语言无关深链：/docs/<path> 按浏览器语言跳转到 /{zh|en}/docs/<path>
export default function Page() {
  return <Redirector />;
}

export function generateStaticParams() {
  const seen = new Set<string>();
  const params: { slug: string[] }[] = [];

  for (const page of source.getPages()) {
    const key = page.slugs.join('/');
    if (seen.has(key)) continue;
    seen.add(key);
    params.push({ slug: page.slugs });
  }

  return params;
}
