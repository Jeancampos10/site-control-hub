-- Cadastros (dados mestres) para uso no app e nos formulários
-- Correção: funções de roles no banco possuem assinatura:
--   public.is_admin(_user_id uuid)
--   public.has_role(_user_id uuid, _role app_role)

-- Função padrão para updated_at (idempotente)
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================
-- Locais
-- =========================
create table if not exists public.cad_locais (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  nome text not null,
  obra text not null default '',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists cad_locais_tipo_idx on public.cad_locais (tipo);
create index if not exists cad_locais_ativo_idx on public.cad_locais (ativo);

drop trigger if exists trg_cad_locais_updated_at on public.cad_locais;
create trigger trg_cad_locais_updated_at
before update on public.cad_locais
for each row execute function public.update_updated_at_column();

alter table public.cad_locais enable row level security;

drop policy if exists "cad_locais_select_auth" on public.cad_locais;
create policy "cad_locais_select_auth"
on public.cad_locais
for select
using (auth.uid() is not null);

drop policy if exists "cad_locais_admin_insert" on public.cad_locais;
drop policy if exists "cad_locais_admin_update" on public.cad_locais;
drop policy if exists "cad_locais_admin_delete" on public.cad_locais;

create policy "cad_locais_admin_insert"
on public.cad_locais
for insert
with check (
  public.is_admin(auth.uid())
  or public.has_role(auth.uid(), 'admin_principal'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

create policy "cad_locais_admin_update"
on public.cad_locais
for update
using (
  public.is_admin(auth.uid())
  or public.has_role(auth.uid(), 'admin_principal'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
)
with check (
  public.is_admin(auth.uid())
  or public.has_role(auth.uid(), 'admin_principal'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

create policy "cad_locais_admin_delete"
on public.cad_locais
for delete
using (
  public.is_admin(auth.uid())
  or public.has_role(auth.uid(), 'admin_principal'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

insert into public.cad_locais (tipo, nome, obra, ativo)
select * from (
  values
    ('Origem', 'Jazida Norte - BR-101', 'BR-101', true),
    ('Origem', 'Jazida Sul - BR-101', 'BR-101', true),
    ('Origem', 'Corte KM 45 - BR-101', 'BR-101', true),
    ('Destino', 'Aterro Norte - BR-101', 'BR-101', true),
    ('Destino', 'Aterro Sul - BR-101', 'BR-101', true),
    ('Destino', 'Aterro KM 30 - BR-101', 'BR-101', true)
) as v(tipo, nome, obra, ativo)
where not exists (
  select 1 from public.cad_locais l where l.tipo = v.tipo and l.nome = v.nome
);

-- =========================
-- Materiais
-- =========================
create table if not exists public.cad_materiais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  unidade text not null default '',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists cad_materiais_ativo_idx on public.cad_materiais (ativo);

drop trigger if exists trg_cad_materiais_updated_at on public.cad_materiais;
create trigger trg_cad_materiais_updated_at
before update on public.cad_materiais
for each row execute function public.update_updated_at_column();

alter table public.cad_materiais enable row level security;

drop policy if exists "cad_materiais_select_auth" on public.cad_materiais;
create policy "cad_materiais_select_auth"
on public.cad_materiais
for select
using (auth.uid() is not null);

drop policy if exists "cad_materiais_admin_insert" on public.cad_materiais;
drop policy if exists "cad_materiais_admin_update" on public.cad_materiais;
drop policy if exists "cad_materiais_admin_delete" on public.cad_materiais;

create policy "cad_materiais_admin_insert"
on public.cad_materiais
for insert
with check (
  public.is_admin(auth.uid())
  or public.has_role(auth.uid(), 'admin_principal'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

create policy "cad_materiais_admin_update"
on public.cad_materiais
for update
using (
  public.is_admin(auth.uid())
  or public.has_role(auth.uid(), 'admin_principal'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
)
with check (
  public.is_admin(auth.uid())
  or public.has_role(auth.uid(), 'admin_principal'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

create policy "cad_materiais_admin_delete"
on public.cad_materiais
for delete
using (
  public.is_admin(auth.uid())
  or public.has_role(auth.uid(), 'admin_principal'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

insert into public.cad_materiais (nome, unidade, ativo)
select * from (
  values
    ('Argila', 'm³', true),
    ('Brita', 'm³', true),
    ('Areia', 'm³', true),
    ('Pedra Rachão', 'm³', true),
    ('Saibro', 'm³', true),
    ('Brita 0', 't', true),
    ('Brita 1', 't', true),
    ('Pó de Pedra', 't', true)
) as v(nome, unidade, ativo)
where not exists (
  select 1 from public.cad_materiais m where m.nome = v.nome
);

-- =========================
-- Fornecedores CAL
-- =========================
create table if not exists public.cad_fornecedores_cal (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  contato text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists cad_fornecedores_cal_ativo_idx on public.cad_fornecedores_cal (ativo);

drop trigger if exists trg_cad_fornecedores_cal_updated_at on public.cad_fornecedores_cal;
create trigger trg_cad_fornecedores_cal_updated_at
before update on public.cad_fornecedores_cal
for each row execute function public.update_updated_at_column();

alter table public.cad_fornecedores_cal enable row level security;

drop policy if exists "cad_fornecedores_cal_select_auth" on public.cad_fornecedores_cal;
create policy "cad_fornecedores_cal_select_auth"
on public.cad_fornecedores_cal
for select
using (auth.uid() is not null);

drop policy if exists "cad_fornecedores_cal_admin_insert" on public.cad_fornecedores_cal;
drop policy if exists "cad_fornecedores_cal_admin_update" on public.cad_fornecedores_cal;
drop policy if exists "cad_fornecedores_cal_admin_delete" on public.cad_fornecedores_cal;

create policy "cad_fornecedores_cal_admin_insert"
on public.cad_fornecedores_cal
for insert
with check (
  public.is_admin(auth.uid())
  or public.has_role(auth.uid(), 'admin_principal'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

create policy "cad_fornecedores_cal_admin_update"
on public.cad_fornecedores_cal
for update
using (
  public.is_admin(auth.uid())
  or public.has_role(auth.uid(), 'admin_principal'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
)
with check (
  public.is_admin(auth.uid())
  or public.has_role(auth.uid(), 'admin_principal'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

create policy "cad_fornecedores_cal_admin_delete"
on public.cad_fornecedores_cal
for delete
using (
  public.is_admin(auth.uid())
  or public.has_role(auth.uid(), 'admin_principal'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

insert into public.cad_fornecedores_cal (nome, cnpj, contato, ativo)
select * from (
  values
    ('Fornecedor Cal A', '00.000.000/0001-00', '(00) 0000-0000', true),
    ('Fornecedor Cal B', '00.000.000/0001-01', '(00) 0000-0001', true),
    ('Fornecedor Cal C', '00.000.000/0001-02', '(00) 0000-0002', true)
) as v(nome, cnpj, contato, ativo)
where not exists (
  select 1 from public.cad_fornecedores_cal f where f.nome = v.nome
);
