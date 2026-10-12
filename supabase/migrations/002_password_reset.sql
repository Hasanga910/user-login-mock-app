-- Password reset via emailed links.

create table public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index password_reset_tokens_user_id_idx on public.password_reset_tokens (user_id);
alter table public.password_reset_tokens enable row level security;
-- No public policies: the table is only accessed server-side with the service role key.

-- Sessions issued before this time are rejected.
alter table public.users add column password_changed_at timestamptz;

-- Recovery emails are unique among password users (Microsoft users may share an address).
create unique index users_password_email_lower_idx
  on public.users (lower(email))
  where auth_provider = 'password';
