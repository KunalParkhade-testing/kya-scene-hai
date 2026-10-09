insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-media',
  'article-media',
  true,
  10485760,
  array['image/png','image/jpeg','image/webp','image/gif']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins can upload article media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'article-media'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Admins can update article media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'article-media'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  bucket_id = 'article-media'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Admins can delete article media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'article-media'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
