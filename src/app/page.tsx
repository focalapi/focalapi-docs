'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Static export cannot use server middleware, so redirect on the client according to browser language.
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const lang = navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
    router.replace(`/${lang}`);
  }, [router]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <p>正在跳转… / Redirecting…</p>
      <p className="text-sm text-fd-muted-foreground">
        <a className="underline" href="/zh">
          简体中文
        </a>
        {' · '}
        <a className="underline" href="/en">
          English
        </a>
      </p>
    </div>
  );
}
