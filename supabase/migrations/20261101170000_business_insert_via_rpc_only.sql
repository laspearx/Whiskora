-- Step 2 of the atomic create (apply ONLY after the app that calls create_business is live — the old register pages
-- insert farms / shops / services / workspaces directly and would get 42501 from here on; they fail before anything is
-- written, so no half-created business is left).
-- After: the API cannot INSERT farms, shops, services or workspaces directly; new businesses come only from
-- create_business (20261101160000), which writes entity + workspace + owner row in one transaction.
-- Unchanged: SELECT / UPDATE / DELETE grants and policies (business edit rights are a separate decision),
-- workspaces_guard (still covers API UPDATE), member RPCs, storage policies, service_role.
revoke insert on public.farms, public.shops, public.services, public.workspaces from anon, authenticated;
