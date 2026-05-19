alter table public.users
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists credits integer not null default 1000,
  add column if not exists created_at timestamptz not null default now();

alter table public.documents
  add column if not exists uploader_id uuid references public.users(id) on delete cascade,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists file_url text not null default '',
  add column if not exists storage_path text,
  add column if not exists file_type text not null default 'application/pdf',
  add column if not exists download_cost integer not null default 10,
  add column if not exists created_at timestamptz not null default now();

alter table public.transactions
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists action text,
  add column if not exists credit_change integer,
  add column if not exists document_id uuid references public.documents(id) on delete set null,
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists users_email_unique_idx on public.users(email);
create unique index if not exists documents_storage_path_unique_idx on public.documents(storage_path);

drop trigger if exists on_auth_user_created on auth.users;
