# Salas da Estação

Gestão de reservas das salas de ensaio da **Estação Musical de Monção (EMM)**.

Aplicação web (pt-PT) onde o público consulta a disponibilidade e submete pedidos de reserva,
e um administrador aprova/rejeita/edita/move reservas, cria reservas recorrentes e configura o
sistema. Construída a partir de `docs/specification.md` e `docs/design-system.md`.

## Stack

- **Next.js (App Router) + TypeScript** — alvo nativo Vercel, também corre em qualquer Node (`next start`).
- **Tailwind CSS v4** — tokens de design (`docs/design-system.md` §6) mapeados em `@theme` (`src/app/globals.css`).
- **Supabase** (`@supabase/ssr`) — persistência, auth do admin, e RLS que garante que o telemóvel nunca é exposto publicamente.
- **Fontes** via `next/font`: Fraunces (substituta de Nocturne Serif), Hanken Grotesk (substituta de Apparat), Noto Music (ornamento).
- **Ícones**: Phosphor.

Tudo o que é específico de plataforma (cliente Supabase, env, deploy) está isolado atrás de fronteiras finas
(`src/lib/supabase/*`, `src/lib/data/repository.ts`), para correr localmente, na Vercel ou auto-alojado.

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local   # preencher URL + chaves do Supabase
npm run dev                  # http://localhost:3000
npm run build && npm start   # build de produção (espelha a Vercel)
```

### Modo de demonstração (sem base de dados)

Se as variáveis `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` **não** estiverem
definidas, a app corre em **modo de demonstração**: as leituras vêm de dados-semente em memória
(`src/lib/data/seed.ts`) e as ações de gestão funcionam durante a sessão do servidor. Ideal para
pré-visualizar a UI sem configurar nada. As escritas persistentes exigem um projeto Supabase real.

## Configurar o Supabase

1. Criar um projeto em [supabase.com](https://supabase.com).
2. SQL editor → colar e correr `supabase/schema.sql` (tabelas, constraint anti-sobreposição, RLS, seed das 9 salas).
3. Authentication → criar o utilizador único do administrador (email + palavra-passe).
4. Project Settings → API → copiar para `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (**apenas servidor** — nunca `NEXT_PUBLIC_`)

### Invariantes garantidas no backend (não só no frontend)

- **Telemóvel nunca público.** O público lê pela vista `public_bookings` (sem coluna `phone`); a tabela
  base só é legível por `authenticated`. Defesa em profundidade: o tipo `PublicBooking` também não tem `phone`.
- **Sem sobreposições.** Uma `EXCLUDE` constraint impede duas reservas pendentes/aprovadas sobrepostas na mesma sala.
- **Pendente bloqueia o horário.** Estados `pendente` e `aprovada` ocupam o bloco.
- **Expiração preguiçosa.** Um pedido pendente cuja hora de início já passou é tratado como `expirada` na leitura.

## Estrutura

```
src/
  app/
    page.tsx                 # público: disponibilidade + grelha + pedido
    actions/                 # server actions (booking, admin, auth)
    admin/                   # login, painel, reservas, salas, definições
  components/
    brand/  schedule/  admin/  ui/
  lib/
    domain/booking.ts        # estados, expiração, sobreposição
    time/                    # blocos de 30 min, datas pt-PT
    grid.ts                  # modelo da grelha (servidor)
    data/repository.ts       # fronteira de acesso a dados (Supabase ↔ seed)
    supabase/                # clientes browser / server / service-role
supabase/schema.sql          # esquema + RLS + seed
middleware.ts                # refresh de sessão + proteção do /admin
```

## Itens em aberto (do design system / spec)

- **HEX do dourado** está por confirmar (erro de copy-paste no brandbook). Usado `#A8966B`.
- **Licenças webfont** de Nocturne Serif / Apparat por confirmar — em uso os substitutos Fraunces / Hanken Grotesk.
- **Canal de notificações** (WhatsApp/SMS) por definir — o telemóvel é recolhido mas o envio ainda não está ligado.
- **Expiração proativa** opcional via cron/edge function do Supabase (hoje é preguiçosa na leitura).
