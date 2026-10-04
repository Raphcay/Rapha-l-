-- Profils clients ARC, liés aux comptes Supabase Auth.
-- À coller dans Supabase : SQL Editor → New query → Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Chaque client ne voit et ne modifie que son propre profil.
create policy "Lire son profil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Créer son profil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Modifier son profil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Crée le profil automatiquement à la première connexion.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
