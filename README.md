# Kya Scene Hai?

A visual explainer publication about India — its systems, culture, economics, science, infrastructure and big questions.

## Stack

- Next.js + React + TypeScript
- Supabase / PostgreSQL for editorial content
- GitHub for source control

## Routes

- `/` — publication homepage
- `/articles` — story archive
- `/articles/[slug]` — article pages
- `/topics` — topic browser
- `/about` — editorial mission

## Supabase

The first migration lives at `supabase/migrations/202609140001_content.sql` and creates categories, articles, tags, article-tag relationships and newsletter subscribers with RLS policies.

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from your Supabase project before wiring the live content queries.
