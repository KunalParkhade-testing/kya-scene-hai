alter table public.articles
  add column if not exists media_folder text;

create policy "Admins can list article media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'article-media'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
