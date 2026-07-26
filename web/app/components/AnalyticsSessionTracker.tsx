"use client";

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics/trackEvent';

// Fires `user_logged_in` once per browser session (not once per page navigation) — this is the
// foundation event Active Users is computed from. Mounted once at the root layout so it runs on
// every route including admin/farm-dashboard, which RootChrome skips its own chrome for.
const FIRED_KEY = 'whiskora_login_tracked_uid';

export default function AnalyticsSessionTracker() {
  useEffect(() => {
    let cancelled = false;

    const trackIfNewSession = async (userId: string) => {
      let already = false;
      try { already = sessionStorage.getItem(FIRED_KEY) === userId; } catch { /* storage unavailable */ }
      if (already || cancelled) return;
      await trackEvent({ eventName: 'user_logged_in' });
      try { sessionStorage.setItem(FIRED_KEY, userId); } catch { /* storage unavailable */ }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) trackIfNewSession(session.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.id) trackIfNewSession(session.user.id);
    });

    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  return null;
}
