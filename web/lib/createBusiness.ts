import type { SupabaseClient } from '@supabase/supabase-js';

export type BusinessType = 'farm' | 'shop' | 'service';

// Fields create_business accepts (allow-list in supabase/migrations/20261101160000_create_business_atomic.sql).
// Owner, approval / publish state and system columns are set by the database, never sent from here.
export type BusinessFields = Record<string, string | number | string[] | null | undefined>;

/**
 * One request key per form content: a double click or a retry after a lost response re-sends the same key and gets
 * the same business back; changing the form makes a new key (a different business is then allowed).
 */
export function createRequestKeyTracker() {
  let last: { body: string; key: string } | null = null;
  return (body: unknown) => {
    const s = JSON.stringify(body);
    if (!last || last.body !== s) last = { body: s, key: crypto.randomUUID() };
    return last.key;
  };
}

export async function createBusiness(
  supabase: SupabaseClient,
  type: BusinessType,
  fields: BusinessFields,
  requestKey: string,
): Promise<{ entityId: number; workspaceId: string }> {
  const clean = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined && v !== ''));
  const { data, error } = await supabase.rpc('create_business', { p_type: type, p_fields: clean, p_request_key: requestKey });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.entity_id) throw new Error('create_business returned no business');
  return { entityId: row.entity_id, workspaceId: row.workspace_id };
}
