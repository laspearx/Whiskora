import { supabase } from '@/lib/supabase';

// Central analytics sink — every event insert must go through this helper, never a direct
// `supabase.from('analytics_events').insert(...)` in a component. Never pass health/pedigree
// details, contact values (phone numbers, LINE IDs), document contents, or auth tokens in
// `metadata` — analytics_events is admin-readable and is not a private data store.

const ANON_ID_KEY = 'whiskora_aid';
const SESSION_ID_KEY = 'whiskora_sid';
const DEDUP_WINDOW_MS = 2000;

// Survives React StrictMode double-invoke and rapid re-renders firing the "same" event twice —
// not a durable server-side dedup, just enough to keep a page-view effect from double-counting.
const recentEvents = new Map<string, number>();

function readOrCreateId(storage: Storage, key: string): string | null {
  try {
    let id = storage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      storage.setItem(key, id);
    }
    return id;
  } catch {
    return null;
  }
}

function getAnonymousId(): string | null {
  if (typeof window === 'undefined') return null;
  return readOrCreateId(window.localStorage, ANON_ID_KEY);
}

function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return readOrCreateId(window.sessionStorage, SESSION_ID_KEY);
}

export interface TrackEventInput {
  eventName: string;
  entityType?: string;
  entityId?: string | number;
  workspaceId?: string;
  farmId?: number;
  metadata?: Record<string, string | number | boolean | null>;
  source?: string;
}

export async function trackEvent(input: TrackEventInput): Promise<void> {
  const dedupKey = `${input.eventName}:${input.entityType || ''}:${input.entityId || ''}`;
  const now = Date.now();
  const last = recentEvents.get(dedupKey);
  if (last && now - last < DEDUP_WINDOW_MS) return;
  recentEvents.set(dedupKey, now);
  if (recentEvents.size > 500) {
    for (const [key, ts] of recentEvents) {
      if (now - ts > DEDUP_WINDOW_MS) recentEvents.delete(key);
    }
  }

  const { data: { session } } = await supabase.auth.getSession();
  const locale = typeof document !== 'undefined' ? document.documentElement.lang || null : null;

  await supabase.from('analytics_events').insert({
    event_name: input.eventName,
    user_id: session?.user?.id || null,
    anonymous_id: session?.user?.id ? null : getAnonymousId(),
    session_id: getSessionId(),
    entity_type: input.entityType || null,
    entity_id: input.entityId != null ? String(input.entityId) : null,
    workspace_id: input.workspaceId || null,
    farm_id: input.farmId || null,
    metadata: input.metadata || {},
    source: input.source || null,
    locale,
  });
}
