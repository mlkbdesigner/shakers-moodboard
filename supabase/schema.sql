-- ============================================================
-- Shakers Moodboard — schema
-- Rode isso UMA VEZ no SQL Editor do Supabase
-- ============================================================

-- ---------- tabelas ----------
create table if not exists moodboards (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  client_name text,
  notes text,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists moodboard_references (
  id uuid primary key default gen_random_uuid(),
  moodboard_id uuid references moodboards(id) on delete cascade,
  image_url text not null,
  storage_path text,
  title text,
  position int default 0,
  created_at timestamptz default now()
);

create table if not exists moodboard_responses (
  id uuid primary key default gen_random_uuid(),
  moodboard_id uuid references moodboards(id) on delete cascade,
  client_name text,
  general_comment text,
  submitted_at timestamptz default now()
);

create table if not exists moodboard_response_items (
  id uuid primary key default gen_random_uuid(),
  response_id uuid references moodboard_responses(id) on delete cascade,
  reference_id uuid references moodboard_references(id) on delete cascade,
  -- cada dimensão: 'yes' | 'maybe' | 'no' | null
  estilo text,
  cores text,
  vibe text,
  tipografia text,
  composicao text,
  mensagem text,
  why text
);

-- ---------- indexes ----------
create index if not exists idx_refs_moodboard on moodboard_references(moodboard_id);
create index if not exists idx_resp_moodboard on moodboard_responses(moodboard_id);
create index if not exists idx_items_resp on moodboard_response_items(response_id);
create index if not exists idx_mb_slug on moodboards(slug);

-- ---------- RLS ----------
alter table moodboards enable row level security;
alter table moodboard_references enable row level security;
alter table moodboard_responses enable row level security;
alter table moodboard_response_items enable row level security;

-- Equipe autenticada: tudo em moodboards e referências
drop policy if exists "team read moodboards" on moodboards;
create policy "team read moodboards" on moodboards
  for select using (auth.role() = 'authenticated');

drop policy if exists "team write moodboards" on moodboards;
create policy "team write moodboards" on moodboards
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "team read refs" on moodboard_references;
create policy "team read refs" on moodboard_references
  for select using (auth.role() = 'authenticated');

drop policy if exists "team write refs" on moodboard_references;
create policy "team write refs" on moodboard_references
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Público anônimo: pode LER moodboards via slug e LER referências; pode INSERIR respostas
drop policy if exists "public read moodboards" on moodboards;
create policy "public read moodboards" on moodboards
  for select using (true);

drop policy if exists "public read refs" on moodboard_references;
create policy "public read refs" on moodboard_references
  for select using (true);

drop policy if exists "public insert response" on moodboard_responses;
create policy "public insert response" on moodboard_responses
  for insert with check (true);

drop policy if exists "team read responses" on moodboard_responses;
create policy "team read responses" on moodboard_responses
  for select using (auth.role() = 'authenticated');

drop policy if exists "team delete responses" on moodboard_responses;
create policy "team delete responses" on moodboard_responses
  for delete using (auth.role() = 'authenticated');

drop policy if exists "public insert items" on moodboard_response_items;
create policy "public insert items" on moodboard_response_items
  for insert with check (true);

drop policy if exists "team read items" on moodboard_response_items;
create policy "team read items" on moodboard_response_items
  for select using (auth.role() = 'authenticated');

-- ---------- storage bucket ----------
insert into storage.buckets (id, name, public)
values ('moodboard-images', 'moodboard-images', true)
on conflict (id) do nothing;

-- política de storage: leitura pública, upload só pra autenticados
drop policy if exists "public read images" on storage.objects;
create policy "public read images" on storage.objects
  for select using (bucket_id = 'moodboard-images');

drop policy if exists "team upload images" on storage.objects;
create policy "team upload images" on storage.objects
  for insert with check (bucket_id = 'moodboard-images' and auth.role() = 'authenticated');

drop policy if exists "team delete images" on storage.objects;
create policy "team delete images" on storage.objects
  for delete using (bucket_id = 'moodboard-images' and auth.role() = 'authenticated');
