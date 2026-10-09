-- Editorial Studio access is controlled by Supabase Auth app_metadata.role = 'admin'.
-- Never use user_metadata for authorization decisions.

create policy "admins can manage articles" on public.articles
for all to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "admins can manage categories" on public.categories
for all to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "admins can manage tags" on public.tags
for all to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "admins can manage article tags" on public.article_tags
for all to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

grant insert, update, delete on public.articles, public.categories, public.tags, public.article_tags to authenticated;
create index if not exists articles_category_id_idx on public.articles(category_id);
create index if not exists article_tags_tag_id_idx on public.article_tags(tag_id);
