-- STATUS: proposed — security branch, not applied anywhere. Staging first, production only on the owner's go-ahead
-- (docs/SECURITY_PHASE1.md §H2). Order on production: this migration → backfill (dry run, review, apply) → app.
--
-- H2 / M5: LINE Login looked users up with auth.admin.listUsers(page 1, 1000) and matched on user_metadata.line_id
-- (writable by the user) OR the email from LINE (not stated as verified). This adds an exact lookup on
-- app_metadata.line_id (service-role-writable only) that works for any number of users. Callable by service_role only.
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

do $$ begin
  if has_function_privilege('anon', 'public.find_auth_user_by_line_id(text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.find_auth_user_by_line_id(text)', 'EXECUTE') then
    raise exception 'STOP: line lookup callable by API users'; end if;
end $$;
