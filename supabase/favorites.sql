-- Favoris des clients ARC.
-- À coller dans Supabase : SQL Editor → New snippet → Run (une seule fois).

create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, product_slug)
);

alter table public.favorites enable row level security;

-- Chaque client ne voit et ne modifie que ses propres favoris.
create policy "Lire ses favoris"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Ajouter ses favoris"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Retirer ses favoris"
  on public.favorites for delete
  using (auth.uid() = user_id);

grant select, insert, delete on public.favorites to authenticated;
