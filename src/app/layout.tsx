import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './global.css';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  // TODO: 替换为文档站正式域名
  metadataBase: new URL('https://docs.focalapi.com'),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">{children}</body>
    </html>
  );
}
