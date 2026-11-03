import type { Metadata } from 'next';
import NotFoundView from './_not-found-view/NotFoundView';

// Branded 404 for every unmatched URL. Prerendered once without the request path, so the title is bilingual;
// the body picks TH / EN from the URL in the browser (NotFoundView).
export const metadata: Metadata = {
  title: { absolute: 'ไม่พบหน้านี้ · Page not found | Whiskora' },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundView />;
}
