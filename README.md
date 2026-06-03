# Shakers Moodboard

Ferramenta de moodboard com feedback granular do cliente.

**Fluxo:**
1. A equipe loga em `/admin`, cria um moodboard e sobe as referências visuais.
2. O site gera um link público (ex: `/m/marca-conoti-abc12`).
3. O cliente abre o link, avalia cada referência em 6 dimensões (estilo, cores, vibe, tipografia, composição, mensagem) — combina / neutro / não combina — e pode escrever o porquê.
4. A equipe vê as respostas no painel do moodboard.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Supabase (auth da equipe, banco Postgres, storage de imagens)
- Deploy: Vercel

## Setup (primeira vez)

### 1. Supabase

1. Cria projeto novo em [supabase.com](https://supabase.com) (free tier serve).
2. Copia **Project URL** e **anon key** (Settings → API).
3. Abre o SQL Editor e cola/roda o conteúdo de `supabase/schema.sql` — cria as tabelas, RLS e o bucket de storage.
4. Em **Authentication → Providers**, deixa o **Email** habilitado. Pra testar local, considera desativar "Confirm email" (Authentication → Email → Confirm email = off), senão precisa confirmar inbox antes de logar.

### 2. Env vars

```bash
cp .env.example .env.local
```

Preenche:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

### 3. Rodar local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. Vai redirecionar pra `/login`. Cria conta da equipe na primeira vez.

### 4. Deploy Vercel

```bash
git init
git add .
git commit -m "init: shakers moodboard"
# conecta a um repo do GitHub e importa no Vercel
```

No Vercel, adiciona as 2 env vars (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

## Páginas

| Rota | Acesso | Função |
|---|---|---|
| `/login` | público | login/signup da equipe |
| `/admin` | equipe | lista de moodboards |
| `/admin/novo` | equipe | cria moodboard + sobe imagens |
| `/admin/[id]` | equipe | vê link compartilhável + respostas |
| `/m/[slug]` | público | cliente avalia (sem login) |

## Dimensões avaliadas

Cada referência recebe nota em 6 dimensões (combina / neutro / não combina) + campo livre "por quê":

- Estilo visual
- Paleta de cores
- Vibe / mood
- Tipografia
- Composição / layout
- Mensagem / copy

Pra mudar, edita `lib/types.ts` (`DIMENSIONS`) e os campos correspondentes em `supabase/schema.sql` (tabela `moodboard_response_items`).

## Estrutura

```
app/
  page.tsx              → redirect /admin
  login/                → auth da equipe
  admin/                → painel (protegido pelo proxy.ts)
    page.tsx            → lista moodboards
    novo/               → criar moodboard
    [id]/               → detalhes + respostas + ShareBar
  m/[slug]/             → form do cliente (público)
  components/Topbar.tsx
lib/
  supabase/             → clients (browser + server)
  types.ts              → Score, DIMENSIONS, Moodboard, etc
supabase/schema.sql     → schema + RLS + bucket de storage
proxy.ts                → protege /admin/* (auth gate)
```
