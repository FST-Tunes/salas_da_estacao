-- ============================================================================
-- Salas da Estação — Supabase schema
-- Estação Musical de Monção (EMM)
--
-- Run this in the Supabase SQL editor (or `supabase db push`). It is
-- idempotent enough to re-run during development. Enforces the two invariants
-- that frontend filtering must NOT be trusted with:
--   1. Phone numbers are never exposed to the public (RLS + a phone-less view).
--   2. No two blocking bookings overlap in the same room (exclusion constraint).
-- ============================================================================

create extension if not exists btree_gist;

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  create type booking_state as enum
    ('pendente', 'aprovada', 'rejeitada', 'cancelada', 'concluida', 'expirada');
exception when duplicate_object then null; end $$;

-- ── Rooms ─────────────────────────────────────────────────────────────────--
-- Room count is NOT hardcoded; the admin manages rows at runtime. Removing a
-- room sets active = false (history is permanent), it is never hard-deleted.
create table if not exists public.rooms (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  position   integer not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Bookings ──────────────────────────────────────────────────────────────--
create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid references public.rooms(id) on delete restrict,
  booker_name   text not null,
  phone         text,                       -- optional; never exposed publicly
  date          date not null,
  start_time    time not null,
  end_time      time not null,
  state         booking_state not null default 'pendente',
  any_room      boolean not null default false,
  -- Admin one-off block: an 'aprovada' row that makes a room/slot unavailable.
  -- Reuses the overlap lock; rendered distinctly and never shows a phone.
  is_block      boolean not null default false,
  recurrence_id uuid,
  created_at    timestamptz not null default now(),
  constraint end_after_start check (end_time > start_time),
  -- "Qualquer sala" requests have no room until the admin assigns one.
  constraint any_room_has_no_room check (not any_room or room_id is null)
);

-- Idempotent for databases created before is_block existed.
alter table public.bookings
  add column if not exists is_block boolean not null default false;

create index if not exists bookings_date_idx on public.bookings (date);
create index if not exists bookings_room_date_idx on public.bookings (room_id, date);

-- ── Overlap lock ────────────────────────────────────────────────────────────
-- A new request may not overlap an approved OR pending booking for the same
-- room (pending is a hard lock). Implemented as an exclusion constraint over a
-- per-day time range so the DB — not the client — is the source of truth.
-- Note: lazy expiry happens on read; an expired-but-still-'pendente' row keeps
-- its lock until the admin/cron flips it, which is acceptably conservative.
alter table public.bookings
  drop constraint if exists bookings_no_overlap;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    room_id with =,
    date with =,
    tsrange(('2000-01-01'::date + start_time), ('2000-01-01'::date + end_time)) with &&
  )
  where (state in ('pendente', 'aprovada') and room_id is not null);

-- ── Settings (single row) ─────────────────────────────────────────────────--
create table if not exists public.app_settings (
  id               boolean primary key default true,  -- single-row guard
  open_time        time not null default '08:00',
  close_time       time not null default '00:00',     -- 00:00 == midnight
  max_advance_days integer not null default 30,
  constraint single_row check (id),
  constraint advance_positive check (max_advance_days > 0)
);

insert into public.app_settings (id) values (true) on conflict (id) do nothing;

-- ── Public-safe view (no phone column by construction) ──────────────────────
-- NOTE: is_block is appended LAST on purpose. `create or replace view` only
-- allows adding columns at the end; inserting one mid-list renames columns
-- positionally and Postgres rejects it (42P16).
create or replace view public.public_bookings as
  select id, room_id, booker_name, date, start_time, end_time,
         state, any_room, recurrence_id, created_at, is_block
  from public.bookings;

-- ============================================================================
-- Row Level Security
--   anon  → may read the phone-less view + rooms + settings; may INSERT a
--           request (forced to 'pendente', no phone leak on read).
--   admin → authenticated user; full control via service-role key server-side
--           which bypasses RLS anyway. Authenticated policies added for safety.
-- ============================================================================
alter table public.rooms        enable row level security;
alter table public.bookings     enable row level security;
alter table public.app_settings enable row level security;

-- Rooms: world-readable; writes only by authenticated admin.
drop policy if exists rooms_read on public.rooms;
create policy rooms_read on public.rooms for select using (true);
drop policy if exists rooms_admin_write on public.rooms;
create policy rooms_admin_write on public.rooms for all
  to authenticated using (true) with check (true);

-- Settings: world-readable; writes only by authenticated admin.
drop policy if exists settings_read on public.app_settings;
create policy settings_read on public.app_settings for select using (true);
drop policy if exists settings_admin_write on public.app_settings;
create policy settings_admin_write on public.app_settings for all
  to authenticated using (true) with check (true);

-- Bookings: the public NEVER selects the base table directly (would expose
-- phone). Reads go through public_bookings. The public MAY insert a request,
-- but only as 'pendente'. Admin reads/writes everything (authenticated).
drop policy if exists bookings_admin_all on public.bookings;
create policy bookings_admin_all on public.bookings for all
  to authenticated using (true) with check (true);

drop policy if exists bookings_public_insert on public.bookings;
create policy bookings_public_insert on public.bookings for insert
  to anon with check (state = 'pendente');

-- Lock down the view to the safe columns and expose it to anon.
grant select on public.public_bookings to anon, authenticated;
grant select, insert on public.bookings to anon;       -- insert gated by policy
grant select on public.rooms to anon, authenticated;
grant select on public.app_settings to anon, authenticated;

-- ── Seed: 9 rooms (8 upstairs + 1 large downstairs) ─────────────────────────
insert into public.rooms (name, position)
select * from (values
  ('Sala 1', 1), ('Sala 2', 2), ('Sala 3', 3), ('Sala 4', 4),
  ('Sala 5', 5), ('Sala 6', 6), ('Sala 7', 7), ('Sala 8', 8),
  ('Sala Grande', 9)
) as v(name, position)
where not exists (select 1 from public.rooms);
