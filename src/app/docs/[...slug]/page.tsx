import { source } from '@/lib/source';
import { Redirector } from '../redirector';

// Language-neutral deep link: redirect /docs/<path> to /{zh|en}/docs/<path> based on browser language.
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
