-- STATUS: proposed — security branch, not applied anywhere. Staging first, production only on the owner's go-ahead
-- (docs/SECURITY_PHASE1.md §M4). Deploy the app of this branch BEFORE this migration (the old app selects pets.note,
-- the request would fail with 42501 after it).
--
-- M4: pets.note was readable by anyone (anon / authenticated column SELECT) for public pets — and the farm "add pet"
-- form invites health history there ("บันทึกเพิ่มเติม เช่น ประวัติสุขภาพ…"), while the real health fields
-- (allergies, chronic_diseases, health_notes, blood_type, traits) are already private / tier-checked. The app never
-- displays note, so nothing visible changes. After: nobody reads note through the API (INSERT / UPDATE of note by
-- the owner unchanged; service_role / definer code unaffected). A read path for the owner / team (RPC) is a separate,
-- later decision.
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pets' and column_name = 'note') then
    raise exception 'STOP: pets.note missing'; end if;
  if has_table_privilege('anon', 'public.pets', 'SELECT') or has_table_privilege('authenticated', 'public.pets', 'SELECT') then
    raise exception 'STOP: a table-level SELECT on pets exists — a column revoke would not take effect; report'; end if;
end $$;

revoke select (note) on public.pets from anon, authenticated;

do $$ begin
  if has_column_privilege('anon', 'public.pets', 'note', 'SELECT') or has_column_privilege('authenticated', 'public.pets', 'note', 'SELECT')
     or has_column_privilege('public', 'public.pets', 'note', 'SELECT') then
    raise exception 'STOP: pets.note still readable through the API (PUBLIC grant / role membership) — report, do not re-grant'; end if;
  if not has_column_privilege('authenticated', 'public.pets', 'note', 'INSERT') then
    raise exception 'STOP: owner INSERT of note lost — unexpected'; end if;
end $$;
