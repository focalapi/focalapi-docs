import { Redirector } from './redirector';

// Language-neutral entry point: redirect /docs to /{zh|en}/docs based on browser language.
// Static export has no server middleware, so this client redirect supports external links such as the main-site footer.
export default function Page() {
  return <Redirector />;
}
