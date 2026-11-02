-- STATUS: proposed — security branch, not applied anywhere. Staging first, production only on the owner's go-ahead
-- (docs/SECURITY_PHASE1.md §H2). Order on production: this migration → evidence report (read-only) → backfill of the
-- VERIFIED group only → app.
--
-- H2 / M5: LINE Login looked users up with auth.admin.listUsers(page 1, 1000) and matched on user_metadata.line_id
-- (writable by the user) OR the email from LINE (not stated as verified).
-- 1) find_auth_user_by_line_id: exact lookup on app_metadata.line_id (service-role-writable only), any number of users.
-- 2) legacy_line_evidence: which legacy accounts can be trusted to own a LINE id WITHOUT trusting user_metadata.
--    'verified' = the account carries the server-made shape of a LINE signup by our callback:
--       email = line_<id>@line.whiskora.internal (the callback's placeholder), no password,
--       exactly one email identity whose identity_data email = the current email and created with the account
--       (≤ 60 s apart), no pending email change, user_metadata.line_id (if any) = that id,
--       and no OTHER account holds the id in app_metadata or as a verified placeholder.
--    'conflict'   = two trusted signals disagree (two verified / app_metadata holders, or app_metadata ≠ placeholder).
--    'unverified' = any other legacy claim (user_metadata.line_id on a real-email account, placeholder with a password,
--                   changed email, mismatching ids): never migrated; the owner re-links through link mode.
--    'already'    = app_metadata.line_id already set and consistent.
--    Cut-off: 'verified' (and trusted-holder status) also requires that the account was created BEFORE this migration
--    was applied (the time is fixed into the function when it is created). Reason: an anonymous user can set an email
--    without confirmation when Confirm email is off (GoTrue: anonymous + autoconfirm → new email identity, no password,
--    no pending change) and keep its session — i.e. forge the server-made shape for someone else's LINE id. Anonymous
--    sign-ins are off on production and staging (checked 2026-11-02, /auth/v1/settings), but that is a setting, and the
--    rules are public; after the cut-off the new app creates LINE accounts WITH app_metadata.line_id, so nothing
--    legitimate needs the placeholder shape any more. Apply this migration ONCE per project (re-applying moves the
--    cut-off), immediately before the app deploy; old-app LINE signups in that gap show up as
--    'server-made shape but created after the cut-off' (unverified) → owner reviews them by hand.
-- Both callable by service_role only. Read-only (no data change).
create or replace function public.find_auth_user_by_line_id(p_line_id text)
returns setof uuid language sql stable security definer set search_path = public, auth as $$
  select u.id from auth.users u
   where p_line_id is not null and length(p_line_id) between 1 and 128
     and u.raw_app_meta_data ->> 'line_id' = p_line_id
   order by u.created_at
   limit 5;   -- > 1 is treated as a conflict by the caller; never more than needed to see that
$$;
revoke all on function public.find_auth_user_by_line_id(text) from public, anon, authenticated;
grant execute on function public.find_auth_user_by_line_id(text) to service_role;

-- created through dynamic SQL so the cut-off (now() at apply time) is a constant inside the function
do $mig$ begin execute format($fn$
create or replace function public.legacy_line_evidence(p_line_id text default null)
returns table (user_id uuid, line_id text, class text, reason text)
language sql stable security definer set search_path = public, auth as $$
  with u as (
    select u.id, u.created_at, u.email,
           nullif(u.raw_app_meta_data ->> 'line_id', '') app_line,
           nullif(u.raw_user_meta_data ->> 'line_id', '') meta_line,
           case when u.email ~ '^line_[A-Za-z0-9_-]{1,128}@line\.whiskora\.internal$'
                then substring(u.email from '^line_([A-Za-z0-9_-]{1,128})@line\.whiskora\.internal$') end ph_line,
           coalesce(u.encrypted_password, '') <> '' has_password,
           coalesce(u.email_change, '') <> '' pending_change,
           (select count(*) from auth.identities i where i.user_id = u.id and i.provider = 'email') email_ids,
           (select count(*) from auth.identities i where i.user_id = u.id and i.provider = 'email'
              and i.identity_data ->> 'email' = u.email and abs(extract(epoch from (i.created_at - u.created_at))) <= 60) email_ids_original
      from auth.users u
  ), shape as (
    select u.*, (u.created_at < %1$L::timestamptz and u.ph_line is not null and not u.has_password and not u.pending_change and u.email_ids = 1
                 and u.email_ids_original = 1 and (u.meta_line is null or u.meta_line = u.ph_line)) server_shape
      from u
  ), claims as ( -- trusted holders per LINE id: app_metadata, or a server-shaped placeholder
    select l, count(distinct id) n from (
      select id, app_line l from shape where app_line is not null
      union all select id, ph_line from shape where server_shape) t group by l
  )
  select s.id, coalesce(s.app_line, s.ph_line, s.meta_line),
    case
      when s.app_line is not null and s.ph_line is not null and s.ph_line <> s.app_line then 'conflict'
      when s.app_line is not null and (select n from claims c where c.l = s.app_line) > 1 then 'conflict'
      when s.app_line is not null then 'already'
      when s.server_shape and (select n from claims c where c.l = s.ph_line) > 1 then 'conflict'
      when s.server_shape then 'verified'
      else 'unverified' end,
    case
      when s.app_line is not null and s.ph_line is not null and s.ph_line <> s.app_line then 'app_metadata differs from placeholder'
      when s.app_line is not null and (select n from claims c where c.l = s.app_line) > 1 then 'LINE id held by more than one trusted account'
      when s.app_line is not null then 'app_metadata set'
      when s.server_shape and (select n from claims c where c.l = s.ph_line) > 1 then 'LINE id held by more than one trusted account'
      when s.server_shape then 'server-made LINE signup'
      when s.ph_line is null then 'claim only in user_metadata (user-writable)'
      when s.created_at >= %1$L::timestamptz and not s.has_password and not s.pending_change and s.email_ids = 1
           and s.email_ids_original = 1 and (s.meta_line is null or s.meta_line = s.ph_line)
        then 'server-made shape but created after the cut-off'
      when s.has_password then 'placeholder email with a password'
      when s.pending_change or s.email_ids_original <> 1 or s.email_ids <> 1 then 'email identity not original'
      else 'user_metadata disagrees with placeholder' end
  from shape s
  where (s.app_line is not null or s.meta_line is not null or s.ph_line is not null)
    and (p_line_id is null or p_line_id in (s.app_line, s.meta_line, s.ph_line));
$$;
$fn$, now()); end $mig$;
revoke all on function public.legacy_line_evidence(text) from public, anon, authenticated;
grant execute on function public.legacy_line_evidence(text) to service_role;

do $$ begin
  if has_function_privilege('anon', 'public.find_auth_user_by_line_id(text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.find_auth_user_by_line_id(text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.legacy_line_evidence(text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.legacy_line_evidence(text)', 'EXECUTE') then
    raise exception 'STOP: LINE identity functions callable by API users'; end if;
end $$;
