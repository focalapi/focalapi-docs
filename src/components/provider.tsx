'use client';
import SearchDialog from '@/components/search';
import { translations } from '@/lib/layout.shared';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { i18nProvider } from 'fumadocs-ui/i18n';
import { useEffect, type ReactNode } from 'react';

export function Provider({ children, lang }: { children: ReactNode; lang: string }) {
  // 静态导出下根 <html> 无法按 locale 渲染，这里同步文档语言标记
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  }, [lang]);

  return (
    <RootProvider search={{ SearchDialog }} i18n={i18nProvider(translations, lang)}>
      {children}
    </RootProvider>
  );
}
