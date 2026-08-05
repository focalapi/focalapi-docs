import { DynamicLink } from 'fumadocs-core/dynamic-link';

const content = {
  zh: {
    title: 'FocalAPI 文档',
    subtitle: '一个密钥，接入主流大模型与多模态能力。OpenAI 兼容接口，覆盖文本、图像、视频与搜索。',
    cta: '快速开始',
    apiRef: 'API 参考',
  },
  en: {
    title: 'FocalAPI Docs',
    subtitle: 'One key for mainstream LLMs and multimodal capabilities. OpenAI-compatible APIs for chat, images, video and search.',
    cta: 'Get Started',
    apiRef: 'API Reference',
  },
};

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = lang === 'zh' ? content.zh : content.en;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight">{t.title}</h1>
      <p className="max-w-xl text-lg text-fd-muted-foreground">{t.subtitle}</p>
      <div className="flex flex-row gap-3">
        <DynamicLink
          href="/[lang]/docs/quickstart"
          className="rounded-lg bg-fd-primary px-5 py-2.5 font-medium text-fd-primary-foreground"
        >
          {t.cta}
        </DynamicLink>
        <DynamicLink
          href="/[lang]/docs/api"
          className="rounded-lg border px-5 py-2.5 font-medium"
        >
          {t.apiRef}
        </DynamicLink>
      </div>
    </main>
  );
}
