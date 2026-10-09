-- Keep auth.jwt() initialization outside row-by-row evaluation in admin policies.
drop policy if exists "admins can manage articles" on public.articles;
drop policy if exists "admins can manage categories" on public.categories;
drop policy if exists "admins can manage tags" on public.tags;
drop policy if exists "admins can manage article tags" on public.article_tags;

create policy "admins can manage articles" on public.articles for all to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "admins can manage categories" on public.categories for all to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "admins can manage tags" on public.tags for all to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy "admins can manage article tags" on public.article_tags for all to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
