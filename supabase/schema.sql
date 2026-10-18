-- Hogar al Día · Preparación de sincronización segura con Supabase
-- Ejecutar manualmente en un proyecto propio de Supabase.
-- No incorpora datos financieros ni claves. La app v1 todavía funciona LOCALMENTE.
create table if not exists public.monthly_budgets (
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, month)
);

alter table public.monthly_budgets enable row level security;

revoke all on public.monthly_budgets from anon;
grant select, insert, update, delete on public.monthly_budgets to authenticated;

create policy "Ver solo mis presupuestos"
on public.monthly_budgets for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Crear solo mis presupuestos"
on public.monthly_budgets for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Modificar solo mis presupuestos"
on public.monthly_budgets for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Eliminar solo mis presupuestos"
on public.monthly_budgets for delete to authenticated
using ((select auth.uid()) = user_id);

-- Para futuras operaciones upsert, actualizar updated_at explícitamente desde la app.
-- IMPORTANTE: activar Auth email y configurar Site URL + Redirect URLs del sitio en GitHub Pages.
-- Nunca colocar service_role en JavaScript público; usar solo la publishable/anon key.
