-- H2 read-only report (after 20261102150000). Run inside `begin read only; … rollback;`. Counts per class and reason —
-- no ids, emails or LINE ids (the backfill dry run prints short id prefixes for the follow-up).
select class, reason, count(*) n from public.legacy_line_evidence() group by 1, 2 order by 1, 2;
