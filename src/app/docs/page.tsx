import { Redirector } from './redirector';

// 语言无关入口：/docs 按浏览器语言跳转到 /{zh|en}/docs
// （静态导出无服务端中间件，客户端跳转；供主站页脚等外部链接使用）
export default function Page() {
  return <Redirector />;
}
