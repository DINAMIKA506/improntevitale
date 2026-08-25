-- Ejecutar una sola vez en Supabase > SQL Editor.
-- Las tablas no permiten acceso directo desde el navegador.

create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null check (char_length(post_slug) between 3 and 100),
  author_name text not null check (char_length(author_name) between 2 and 80),
  body text not null check (char_length(body) between 2 and 1200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists blog_comments_post_status_created_idx
  on public.blog_comments (post_slug, status, created_at desc);

create table if not exists public.resource_submissions (
  id uuid primary key default gen_random_uuid(),
  resource_id text not null check (resource_id in ('madurez-vocacional','estilos-aprendizaje','ruta-decision','proyecto-vida','ficha-tecnica')),
  participant_name text,
  participant_email text,
  answers jsonb not null,
  status text not null default 'new' check (status in ('new', 'reviewing', 'completed', 'archived')),
  consented_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists resource_submissions_status_created_idx
  on public.resource_submissions (status, created_at desc);

alter table public.blog_comments enable row level security;
alter table public.resource_submissions enable row level security;

revoke all on table public.blog_comments from anon, authenticated;
revoke all on table public.resource_submissions from anon, authenticated;
grant all on table public.blog_comments to service_role;
grant all on table public.resource_submissions to service_role;

comment on table public.blog_comments is 'Comentarios del blog; solo status approved se publica mediante la API del servidor.';
comment on table public.resource_submissions is 'Respuestas privadas de recursos y ficha técnica; acceso exclusivo del servidor y administradores.';
