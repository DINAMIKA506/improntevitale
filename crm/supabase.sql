-- CRM privado de Impronte Vitale
-- Ejecutar completo en Supabase > SQL Editor.
-- Se puede ejecutar nuevamente: las instrucciones son idempotentes.

create extension if not exists pgcrypto;

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
  resource_id text not null,
  participant_name text,
  participant_email text,
  answers jsonb not null,
  status text not null default 'new' check (status in ('new', 'reviewing', 'completed', 'archived')),
  admin_notes text,
  consented_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.resource_submissions drop constraint if exists resource_submissions_resource_id_check;
alter table public.resource_submissions add column if not exists admin_notes text;

create index if not exists resource_submissions_status_created_idx
  on public.resource_submissions (status, created_at desc);

create table if not exists public.contact_leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'scheduled', 'closed', 'archived')),
  admin_notes text,
  created_at timestamptz not null default now()
);

create index if not exists contact_leads_status_created_idx
  on public.contact_leads (status, created_at desc);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$'),
  title text not null,
  excerpt text,
  category text not null default 'Impronte',
  published_at timestamptz not null default now(),
  read_time text,
  image_url text,
  image_alt text,
  body text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_status_published_idx
  on public.blog_posts (status, published_at desc);

create table if not exists public.resources (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$'),
  kicker text not null default 'Recurso interactivo',
  title text not null,
  description text,
  duration text,
  note text,
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_content (key, value)
values ('homepage', jsonb_build_object(
  'hero_kicker', 'Orientación + Psicopedagogía',
  'hero_title', 'Tu proyecto de vida merece una ruta que se sienta',
  'hero_accent', 'tuya.',
  'hero_description', 'Un espacio profesional, cercano y humano para conocerte mejor, tomar decisiones con claridad y construir herramientas que te acompañen en cada etapa.',
  'primary_label', 'Agendar sesión 1:1',
  'secondary_label', 'Explorar recursos',
  'secondary_url', '/recursos/',
  'booking_url', 'https://wa.me/50689437609',
  'booking_label', 'Agendar 1:1'
)) on conflict (key) do nothing;

insert into public.blog_posts (slug, title, excerpt, category, published_at, read_time, image_url, image_alt, body, status)
values
(
  'la-metacognicion',
  'La metacognición',
  'Una habilidad que podemos desarrollar y enseñar para que cada estudiante sea protagonista de su aprendizaje.',
  'Aprendizaje',
  '2021-11-30T12:00:00-06:00',
  '4 min de lectura',
  'https://improntevitale.vercel.app/assets/blog-metacognicion.avif',
  'Representación de ideas y procesos de aprendizaje',
  $post$La metacognición es una habilidad que podemos desarrollar y enseñar, pero es necesario interiorizarla primero para poder aplicarla en nuestro contexto laboral a nivel educativo.

John Flavell la define como el control que tiene la persona de sus destrezas y procesos cognitivos y la habilidad para darse cuenta de estos. Permite monitorear el aprendizaje no solamente al final con un examen, sino a lo largo de todo el proceso.

La metacognición permite que exista un aprendizaje visible y brinda autonomía al estudiante. También ayuda al docente a reflexionar sobre su propia práctica, enseñar a pensar y aprender, y crear una comunidad de aprendizaje más consciente.

## ¿Cuál es su implicación en el desarrollo cognitivo y el aprendizaje?

Permite que cada estudiante sea protagonista de su propio aprendizaje, tomando en cuenta la manera en la que aprende sin generar distinciones y aplicando estrategias inclusivas.

La metacognición ayuda a darse cuenta de qué temas cuestan más, verificar información, examinar alternativas y crear apoyos para recordar y organizarse.

## Estrategias para aulas inclusivas

Podemos trabajar con grupos cooperativos, deducir significados desde el contexto, desglosar las tareas en pasos visibles y utilizar mapas conceptuales para reconocer relaciones y procesos de aprendizaje.

¿Qué otra estrategia de metacognición conocés?$post$,
  'published'
),
(
  'rol-profesional-psicopedagogia-inclusion',
  'Rol profesional en Psicopedagogía en materia de inclusión',
  'Una mirada al papel que podemos asumir para construir experiencias educativas más inclusivas.',
  'Inclusión',
  '2021-12-07T12:00:00-06:00',
  '3 min de lectura',
  'https://improntevitale.vercel.app/assets/blog-inclusion.avif',
  'Libros y lápices en un entorno educativo',
  $post$## ¿Cuál es nuestro rol en materia de inclusión en la sociedad costarricense?

Para realizar una intervención adecuada es necesario conocer las necesidades y la realidad de la población con la que trabajamos.

Debemos conocer las leyes en materia de inclusión y discapacidad, comprender cada condición, visualizar a la familia como actor principal y abrir espacios para que la comunidad educativa viva la inclusión como una filosofía cotidiana.

También es importante crear redes institucionales, utilizar la motivación como base de la intervención, reconocer el juego como herramienta, trabajar las habilidades sociales y colaborar de forma interdisciplinaria.

El rol de la persona profesional en Psicopedagogía es versátil y permite acompañar procesos académicos, de evaluación y de desarrollo de habilidades.

Como profesionales tenemos la responsabilidad de luchar diariamente por la inclusión y velar por los derechos de todas las personas.

¿Y vos cómo contribuís a la inclusión en nuestra sociedad?$post$,
  'published'
),
(
  'trabajo-interdisciplinario',
  'Trabajo interdisciplinario',
  'El trabajo entre disciplinas es fundamental para fortalecer la atención y el desarrollo integral de cada persona.',
  'Psicopedagogía',
  '2021-12-07T13:00:00-06:00',
  '2 min de lectura',
  'https://improntevitale.vercel.app/assets/blog-interdisciplinario.avif',
  'Personas colaborando en equipo',
  $post$El trabajo entre disciplinas es fundamental para lograr un mejor desarrollo y fortalecimiento de la población con la cual trabajamos diariamente. Como profesionales debemos reconocer que cada disciplina tiene su propia área de trabajo.

## ¿Con cuáles profesionales puede trabajar una persona profesional en Psicopedagogía?

Cada profesional tiene una función específica que complementa el trabajo de los demás. Cada caso es diferente y el rol se adapta a la necesidad que se debe atender.

Debemos trabajar de forma colaborativa para brindar una mejor atención y buscar el desarrollo integral de la persona, formando una verdadera red de apoyo.

## Principales aciertos para el trabajo conjunto

Es importante crear confianza entre estudiante, docente y familia; revisar los apoyos del contexto; mantener comunicación asertiva; y generar sesiones ajustadas a las necesidades e intereses de cada estudiante.

El rol psicopedagógico es vital para generar consulta y acompañamiento. Nuestro papel es brindar un apoyo ajustado a cada caso, siempre desde el trabajo colaborativo.$post$,
  'published'
)
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', true, 4194304, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 4194304, allowed_mime_types = excluded.allowed_mime_types;

alter table public.blog_comments enable row level security;
alter table public.resource_submissions enable row level security;
alter table public.contact_leads enable row level security;
alter table public.blog_posts enable row level security;
alter table public.resources enable row level security;
alter table public.site_content enable row level security;

revoke all on table public.blog_comments from anon, authenticated;
revoke all on table public.resource_submissions from anon, authenticated;
revoke all on table public.contact_leads from anon, authenticated;
revoke all on table public.blog_posts from anon, authenticated;
revoke all on table public.resources from anon, authenticated;
revoke all on table public.site_content from anon, authenticated;

grant all on table public.blog_comments to service_role;
grant all on table public.resource_submissions to service_role;
grant all on table public.contact_leads to service_role;
grant all on table public.blog_posts to service_role;
grant all on table public.resources to service_role;
grant all on table public.site_content to service_role;

comment on table public.resource_submissions is 'Respuestas privadas de recursos y ficha técnica; acceso exclusivo desde el CRM.';
comment on table public.contact_leads is 'Consultas recibidas desde la página de contacto.';
comment on table public.blog_posts is 'Artículos administrados desde el CRM privado de Impronte Vitale.';
