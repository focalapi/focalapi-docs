'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';

export function Redirector() {
  const params = useParams();

  useEffect(() => {
    const lang = navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
    const slug = (params.slug as string[] | undefined) ?? [];
    const target = `/${lang}/docs${slug.length > 0 ? `/${slug.join('/')}` : ''}`;
    // Use a full-page navigation to preserve the hash; router.replace omits it.
    window.location.replace(target + window.location.hash);
  }, [params]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <p>正在跳转… / Redirecting…</p>
    </div>
  );
}
