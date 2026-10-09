-- Align Data API privileges with the intended least-privilege access model.
-- Public users can read published articles and categories, and submit newsletter signups.
-- Authenticated non-admin users must not be able to write editorial content.
-- Admin write authorization remains enforced by the existing RLS policies.

revoke all privileges on table
  public.articles,
  public.categories,
  public.tags,
  public.article_tags,
  public.newsletter_subscribers
from anon, authenticated;

grant select on table public.articles, public.categories to anon, authenticated;
grant insert, update, delete on table public.articles to authenticated;
grant insert on table public.newsletter_subscribers to anon, authenticated;

-- Remove unused public read policies; the tables are not exposed to public roles.
drop policy if exists "tags are public" on public.tags;
drop policy if exists "article tags are public" on public.article_tags;

-- Keep sequence access limited to the sequences used by permitted inserts.
revoke all privileges on sequence
  public.articles_id_seq,
  public.categories_id_seq,
  public.tags_id_seq,
  public.newsletter_subscribers_id_seq
from anon, authenticated;

grant usage on sequence public.articles_id_seq to authenticated;
grant usage on sequence public.newsletter_subscribers_id_seq to anon, authenticated;
