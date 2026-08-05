import { Provider } from '@/components/provider';
import { i18n } from '@/lib/i18n';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

export function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!(i18n.languages as string[]).includes(lang)) notFound();

  return <Provider lang={lang}>{children}</Provider>;
}
