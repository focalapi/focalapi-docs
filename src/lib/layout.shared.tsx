import { i18n } from '@/lib/i18n';
import { uiTranslations } from 'fumadocs-ui/i18n';
import { openapiTranslations } from 'fumadocs-openapi/i18n';
import { zhCN } from '@fumadocs/language/zh-cn';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, appNameEn, gitBaseUrl } from './shared';

// 官方简体中文语言包（覆盖 UI + OpenAPI 组件字符串），英文为组件内建默认值
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
