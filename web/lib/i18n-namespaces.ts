// Which message namespaces reach the browser (i18n Phase 2). The [locale] layout sends GLOBAL (+ LAYOUT_EXTRA);
// every translated page adds its own through <ScopedMessages ns={[…]}> in its app/[locale]/… route file.
// tests/i18n-namespaces.test.mjs fails if a component uses a namespace its route does not provide.
export const GLOBAL_NAMESPACES = ['nav', 'footer', 'common'] as const;
// `login` stays global until PR #37 lands: app/[locale]/login/page.tsx is owned by that PR and cannot be wrapped here.
export const LAYOUT_EXTRA_NAMESPACES = ['login'] as const;
