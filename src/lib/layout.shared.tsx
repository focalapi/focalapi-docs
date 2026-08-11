import { i18n } from '@/lib/i18n';
import { uiTranslations } from 'fumadocs-ui/i18n';
import { openapiTranslations } from 'fumadocs-openapi/i18n';
import { zhCN } from '@fumadocs/language/zh-cn';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, appNameEn, gitBaseUrl } from './shared';

// Official Simplified Chinese locale for UI and OpenAPI components; component defaults provide English.
export const translations = i18n
  .translations()
  .extend(uiTranslations())
  .extend(openapiTranslations())
  .preset('zh', zhCN())
  .add({
    en: { displayName: 'English' },
  });

export function baseOptions(locale: string): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: locale === 'zh' ? appName : appNameEn,
    },
    githubUrl: gitBaseUrl,
  };
}
