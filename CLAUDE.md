# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repo is **pre-implementation**. There is no application code, build system, or tests yet — only:

- `docs/specification.md` — functional spec (in European Portuguese) for the web app.
- `docs/design-system.md` — brand-derived design tokens and UI guidelines (European Portuguese).
- `Logotipos Banda MM/` and `Logotipos Estação MM/` — brand logo PNGs (color / black / white variants).

There are no lint/build/test commands because no stack has been chosen. When asked to "build the app", first confirm the stack with the user, then scaffold from the two docs above. The UI is in European Portuguese; keep all user-facing copy in pt-PT.

## Deployment & infrastructure

Decided constraints for whatever stack gets chosen:

- **Primary deploy target: Vercel.** The project structure must work on Vercel out of the box.
- **Database: Supabase.** Used for persistence (and is the natural fit for auth/notifications if needed).
- **Must run locally for testing.** A developer should be able to clone, configure env vars, and run the app locally to test before deploying.
- **Keep it modular / portable.** Don't hardwire Vercel- or Supabase-specific assumptions throughout the code. It should be possible to run locally or self-host on one of the user's own domains. Isolate platform/infra dependencies (DB client, env config, deploy adapters) behind thin boundaries so the app isn't locked to Vercel.

Configuration (Supabase URL/keys, admin login, etc.) must come from environment variables — never committed — so the same codebase runs locally, on Vercel, or self-hosted by swapping env values.

### Recommended stack (Vercel-native, portable)

Chosen to deploy to Vercel with zero adapter work while staying self-hostable:

- **Next.js (App Router) + TypeScript.** First-class Vercel target — `vercel deploy` works with no config. Also runs anywhere Node runs via `next start`, so self-hosting on your own domain needs no code changes.
- **Supabase via `@supabase/supabase-js`** (and `@supabase/ssr` for cookie-based sessions in the App Router). The Supabase client talks to its REST/Realtime endpoints over HTTPS, so it is **not** tied to Vercel and works identically locally or self-hosted.
- **Styling:** Tailwind CSS, with the design tokens from `docs/design-system.md` §6 mapped into the Tailwind theme (or plain CSS variables in `globals.css`). Keep it framework-light to preserve portability.
- **Auth:** Supabase Auth for the single admin login. Public users stay anonymous (no auth).
- **Scheduled expiry** (`Pendente → Expirada`): do it lazily on read (compute state from `start_time` vs. now) as the portable default; a Supabase scheduled function / cron can be added later for proactive expiry. Avoid Vercel Cron as the *only* mechanism so the app isn't platform-locked.

**Vercel-readiness rules** (keep the build green on Vercel from day one):

- Use **Node serverless functions** (the default runtime), not Edge, unless a route genuinely needs Edge — Edge has a restricted API surface and hurts portability.
- All secrets via env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser-safe), and the **service-role key server-side only** (never `NEXT_PUBLIC_`). Provide a `.env.example`; never commit `.env`.
- The **service-role key must never reach the client** — phone numbers and admin actions depend on this. Public reads use the anon key + Supabase Row Level Security; enforce the "phone never exposed publicly" rule with RLS, not just frontend filtering.

### Local development

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + keys
npm run dev                  # http://localhost:3000
npm run build && npm start   # production build, mirrors Vercel
```

## What the app is

The web app is named **"Salas da Estação"** (use this exact name in titles, headers, metadata, and `package.json`). It manages rehearsal-room bookings for the **Estação Musical de Monção (EMM)**. Two roles:

- **Public users** — no account. Browse room availability, submit booking requests, see approved bookings.
- **Single admin** — logs in. Approves/rejects/edits/moves bookings, creates recurring bookings, configures the system.

Initial setup: 9 rooms (8 small upstairs + 1 large downstairs), but **room count must not be hardcoded** — the admin adds/removes/renames rooms at runtime.

## Core domain rules (from `docs/specification.md`)

These are the non-obvious invariants that drive the data model and backend logic:

- **Time is block-based, never free-typed.** Bookings are built from contiguous 30-minute blocks. Min duration 30 min; max undefined. Operating hours default 08:00–00:00, configurable.
- **Pending requests block the slot immediately.** A new request may not overlap with either an *approved* or a *pending* booking for the same room. Pending acts as a hard lock.
- **Nothing is auto-approved.** Requests enter as `Pendente` and require admin action.
- **Auto-expiry:** when a pending booking's start time passes while still pending, it becomes `Expirada` and stops blocking the slot. This needs a scheduled/lazy expiry mechanism.
- **Booking lifecycle states:** `Pendente`, `Aprovada`, `Rejeitada`, `Cancelada`, `Concluída`, `Expirada`.
- **"Qualquer sala disponível"** is a first-class booking option: user requests any free room for a slot; admin assigns the actual room on approval.
- **Recurring bookings** are admin-only (e.g. every Tuesday 20:00–22:00).
- **Permanent history.** No booking is ever auto-deleted — kept for audit/stats. State transitions, not deletions.
- **Phone number is optional** and **must never be exposed publicly** (enforce on both frontend and backend). Public views show room, time, and booker name only. Phone is used solely for approval/rejection/change notifications (channel TBD: WhatsApp/SMS).
- Booking record fields: name, phone (optional), date, start time, end time, specific room *or* "any available room".

## Design system (from `docs/design-system.md`)

The visual identity is **clássica-moderna**: navy-anchored, serif headings, sober. Three guiding words: *serena, institucional, musical.* When building UI, copy the `:root` token block from `docs/design-system.md` §6 verbatim as the design-token baseline. Key points:

- **Palette:** navy `#1D1A55` (ink/structure), sky `#DBF0FA` (background), red `#C21A26` (alerts/destructive), gold `#A8966B` (accent — *the gold HEX is unconfirmed; the brandbook has a copy-paste error, see §2*).
- **Availability states** are the UX core — green=free `#DCEFE6`/`#2E8B6B`, amber=pending `#F3EAD3`/`#B58A1E`, red=approved `#F7DEE0`/`#C21A26`, grey=off-hours `#E3EAEF`/`#8A93A8`. Brand palette has no green/amber, so these are deliberately desaturated. **Never rely on color alone** — every block/badge also needs a text label and/or icon (AA contrast required).
- **Typography:** Nocturne Serif (headings, big numerals/times) + Apparat (all UI/body) + Noto Music (decorative musical glyphs only, never text). Nocturne/Apparat may need webfont licenses — fallbacks are Fraunces and Hanken Grotesk respectively.
- **`{ }` brace motif:** a recurring brand element — frame section titles and "hug" the user's selected block range in the schedule grid with braces.
- **Sober shapes:** small corner radii (4–12px max), subtle navy-tinted shadows, hairline borders. Avoid the generic-app look (heavy shadows, very round corners). Mobile-first — people check availability on phones.
- The **30-min schedule grid** is the most important screen: columns = rooms (or a day), rows = 30-min blocks; each cell colored by state + labeled.
