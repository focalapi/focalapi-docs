'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';

export function Redirector() {
  const params = useParams();

  useEffect(() => {
    const lang = navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
    const slug = (params.slug as string[] | undefined) ?? [];
    const target = `/${lang}/docs${slug.length > 0 ? `/${slug.join('/')}` : ''}`;
    // 用整页跳转保留锚点（router.replace 不带 hash）
    window.location.replace(target + window.location.hash);
  }, [params]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <p>正在跳转… / Redirecting…</p>
    </div>
  );
}
