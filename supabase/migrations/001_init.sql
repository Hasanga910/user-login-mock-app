create table public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique,
  password_hash text,
  microsoft_oid text unique,
  email text,
  first_name text,
  last_name text,
  company text,
  role text check (role in ('admin','user')),
  auth_provider text not null check (auth_provider in ('password','microsoft')),
  profile_completed boolean not null default false,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);
create unique index users_username_lower_idx on public.users (lower(username));
alter table public.users enable row level security;
-- No public policies: the table is only accessed server-side with the service role key.
