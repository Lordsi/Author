begin;

create table if not exists public.purchases (
  email text primary key,
  stripe_session_id text,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

alter table public.purchases enable row level security;

drop policy if exists "Service role can manage purchases" on public.purchases;

create policy "Service role can manage purchases"
  on public.purchases
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

commit;
