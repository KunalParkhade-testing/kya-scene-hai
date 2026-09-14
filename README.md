# Kya Scene Hai?

A visual editorial publication about India, powered by Next.js + Supabase.

## Stack
- Next.js App Router + TypeScript
- Supabase Postgres + Auth
- Supabase SSR for cookie-based sessions
- GitHub source control

## Public routes
- `/` — live homepage
- `/articles` — live archive
- `/articles/[slug]` — live story pages
- `/topics` — topic browser
- `/about` — project/editorial philosophy

## Editorial Studio
- `/admin` — authenticated newsroom
- Email/password sign-in through Supabase Auth
- Admin authorization uses `app_metadata.role = "admin"`
- Create, edit, publish, archive and delete stories
- Assign categories, reading time, hero copy and hero image URL
- Story body is stored as JSON blocks in Supabase

## Supabase
The project is configured for the Supabase project `vrwcnvihkocwnocnaxmr`.

Migrations:
- `202609140001_content.sql` — editorial content schema + public RLS
- `202609140002_admin_publishing.sql` — admin publishing policies

The public site reads only published articles from Supabase. Drafts and archived stories stay out of the public site.

## Configure an editor
1. Create/sign in a user in Supabase Authentication.
2. In that user's **App Metadata**, set `{ "role": "admin" }`.
3. Put the project's publishable key in `.env.local` using `.env.example`.
4. Open `/admin` and sign in.

Authorization deliberately uses `app_metadata`, not editable `user_metadata`.

## Environment
```env
NEXT_PUBLIC_SUPABASE_URL=https://vrwcnvihkocwnocnaxmr.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Never put a Supabase secret/service-role key in a `NEXT_PUBLIC_` variable or browser code.
