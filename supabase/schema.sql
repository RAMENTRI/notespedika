create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  credits integer not null default 1000 check (credits >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 140),
  description text,
  file_url text not null default '',
  storage_path text not null unique,
  file_type text not null default 'application/pdf' check (file_type = 'application/pdf'),
  download_cost integer not null default 10 check (download_cost > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null check (action in ('signup', 'upload', 'download')),
  credit_change integer not null,
  document_id uuid references public.documents(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists documents_created_at_idx on public.documents(created_at desc);
create index if not exists documents_uploader_id_idx on public.documents(uploader_id);
create index if not exists transactions_user_id_idx on public.transactions(user_id);

alter table public.users enable row level security;
alter table public.documents enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "Users can view profiles" on public.users;
create policy "Users can view profiles"
on public.users for select
to authenticated
using (true);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Authenticated users can view documents" on public.documents;
create policy "Authenticated users can view documents"
on public.documents for select
to authenticated
using (true);

drop policy if exists "Users can view own transactions" on public.transactions;
create policy "Users can view own transactions"
on public.transactions for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, credits)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    new.email,
    1000
  )
  on conflict (id) do nothing;

  insert into public.transactions (user_id, action, credit_change)
  values (new.id, 'signup', 1000)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.ensure_user_profile()
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user auth.users%rowtype;
  inserted_user_id uuid;
  profile_row public.users%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select * into current_user
  from auth.users
  where id = auth.uid();

  if current_user.id is null then
    raise exception 'Authenticated user not found.';
  end if;

  insert into public.users (id, name, email, credits)
  values (
    current_user.id,
    coalesce(current_user.raw_user_meta_data ->> 'name', current_user.raw_user_meta_data ->> 'full_name'),
    current_user.email,
    1000
  )
  on conflict (id) do update
  set name = coalesce(public.users.name, excluded.name),
      email = coalesce(public.users.email, excluded.email)
  returning id into inserted_user_id;

  insert into public.transactions (user_id, action, credit_change)
  select current_user.id, 'signup', 1000
  where not exists (
    select 1
    from public.transactions
    where user_id = current_user.id
      and action = 'signup'
  );

  select * into profile_row
  from public.users
  where id = current_user.id;

  return profile_row;
end;
$$;

create or replace function public.create_document_with_credit(
  p_title text,
  p_description text,
  p_storage_path text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_document_id uuid;
  next_credits integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if lower(right(p_storage_path, 4)) <> '.pdf' then
    raise exception 'Only PDF files are supported.';
  end if;

  perform public.ensure_user_profile();

  insert into public.documents (uploader_id, title, description, storage_path, file_url)
  values (auth.uid(), trim(p_title), nullif(trim(p_description), ''), p_storage_path, p_storage_path)
  returning id into new_document_id;

  update public.users
  set credits = credits + 50
  where id = auth.uid()
  returning credits into next_credits;

  insert into public.transactions (user_id, action, credit_change, document_id)
  values (auth.uid(), 'upload', 50, new_document_id);

  return next_credits;
end;
$$;

create or replace function public.process_document_download(p_document_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  doc_cost integer;
  next_credits integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select download_cost into doc_cost
  from public.documents
  where id = p_document_id;

  if doc_cost is null then
    raise exception 'Document not found.';
  end if;

  update public.users
  set credits = credits - doc_cost
  where id = auth.uid()
    and credits >= doc_cost
  returning credits into next_credits;

  if next_credits is null then
    raise exception 'Not enough credits.';
  end if;

  insert into public.transactions (user_id, action, credit_change, document_id)
  values (auth.uid(), 'download', -doc_cost, p_document_id);

  return next_credits;
end;
$$;

grant execute on function public.ensure_user_profile() to authenticated;
grant execute on function public.create_document_with_credit(text, text, text) to authenticated;
grant execute on function public.process_document_download(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 52428800, array['application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload PDFs to own folder" on storage.objects;
create policy "Users can upload PDFs to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(right(name, 4)) = '.pdf'
);

drop policy if exists "Authenticated users can create signed document URLs" on storage.objects;
create policy "Authenticated users can create signed document URLs"
on storage.objects for select
to authenticated
using (bucket_id = 'documents');
