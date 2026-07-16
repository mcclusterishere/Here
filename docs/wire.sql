-- ============================================================
-- THE WIRE — the daily record desk.
--
-- One table: the claim going around, the context that corrects
-- it, and the sources that back it. The world can read; only
-- the desk can file. Feeds wire.html — and every entry is the
-- citable link a reel points back to.
--
-- PASTE: Supabase → SQL Editor → run this whole file once.
-- ============================================================

create table if not exists public.wire (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  claim      text not null,
  context    text not null,
  sources    jsonb not null default '[]'::jsonb,
  tag        text not null default '',
  uid        uuid default auth.uid()
);

alter table public.wire enable row level security;

-- the world reads the record
drop policy if exists wire_read on public.wire;
create policy wire_read on public.wire
  for select to anon, authenticated using (true);

-- only the desk files reports
drop policy if exists wire_file on public.wire;
create policy wire_file on public.wire
  for insert to authenticated
  with check ((auth.jwt()->>'email') = 'matthew@mccluster.org');

-- and only the desk can pull one
drop policy if exists wire_pull on public.wire;
create policy wire_pull on public.wire
  for delete to authenticated
  using ((auth.jwt()->>'email') = 'matthew@mccluster.org');

grant select on public.wire to anon, authenticated;
grant insert, delete on public.wire to authenticated;

-- self-check: an empty (or growing) wire, newest first
select id, created_at, claim, tag from public.wire order by created_at desc limit 5;
