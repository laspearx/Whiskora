"use client";

import NextLink from 'next/link';
import { useRouter as useNextRouter, usePathname as useNextPathname } from 'next/navigation';
import { useLocale } from './context';
import React from 'react';

export function useRouter() {
  const router = useNextRouter();
  const locale = useLocale();
  return {
    ...router,
    push: (href: string, options?: any) => {
      const localizedHref = href.startsWith('/') ? `/${locale}${href}` : href;
      return router.push(localizedHref, options);
    },
    replace: (href: string, options?: any) => {
      if (options?.locale) {
        const currentPath = window.location.pathname.replace(new RegExp(`^/${locale}`), '') || '/';
        return router.push(`/${options.locale}${currentPath}`);
      }
      const localizedHref = href.startsWith('/') ? `/${locale}${href}` : href;
      return router.replace(localizedHref, options);
    },
  };
}

export function usePathname() {
  const pathname = useNextPathname();
  const locale = useLocale();
  return pathname.replace(new RegExp(`^/${locale}`), '') || '/';
}

export function Link({ href, ...props }: React.ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  const localizedHref =
    typeof href === 'string' && href.startsWith('/')
      ? `/${locale}${href}`
      : href;
  return <NextLink href={localizedHref} {...props} />;
}
