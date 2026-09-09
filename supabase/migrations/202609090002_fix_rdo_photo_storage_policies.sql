-- Photo paths use the RDO id as their first folder: {rdo_id}/{file_name}.
drop policy if exists "members access their project photos" on storage.objects;

create policy "project members read RDO photos"
on storage.objects
for select
using (
  bucket_id = 'rdo-photos'
  and exists (
    select 1
    from public.rdos
    where id = ((storage.foldername(name))[1])::uuid
      and public.is_project_member(project_id)
  )
);

create policy "authors upload RDO photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'rdo-photos'
  and exists (
    select 1
    from public.rdos
    where id = ((storage.foldername(name))[1])::uuid
      and created_by = auth.uid()
      and status in ('DRAFT', 'WITH_NOTES')
  )
);

create policy "authors delete RDO photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'rdo-photos'
  and exists (
    select 1
    from public.rdos
    where id = ((storage.foldername(name))[1])::uuid
      and created_by = auth.uid()
      and status in ('DRAFT', 'WITH_NOTES')
  )
);
