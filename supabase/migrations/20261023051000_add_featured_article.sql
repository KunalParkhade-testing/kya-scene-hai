alter table public.articles
  add column if not exists is_featured boolean not null default false;

create unique index if not exists articles_single_featured_published_idx
  on public.articles (status)
  where is_featured and status = 'published';

create or replace function public.keep_single_featured_article()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_featured and new.status = 'published' then
    update public.articles
    set is_featured = false,
        updated_at = pg_catalog.now()
    where is_featured
      and status = 'published'
      and id is distinct from new.id;
  end if;

  return new;
end;
$$;

create trigger keep_single_featured_article
before insert or update of is_featured, status on public.articles
for each row
execute function public.keep_single_featured_article();
