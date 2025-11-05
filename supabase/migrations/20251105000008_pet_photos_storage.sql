-- Crear bucket para fotos de mascotas
insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', true)
on conflict (id) do nothing;

-- Políticas RLS para el bucket pet-photos
-- Los usuarios pueden subir sus propias fotos
create policy "Users can upload pet photos"
on storage.objects for insert
with check (
  bucket_id = 'pet-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden ver sus propias fotos
create policy "Users can view pet photos"
on storage.objects for select
using (
  bucket_id = 'pet-photos'
);

-- Los usuarios pueden eliminar sus propias fotos
create policy "Users can delete pet photos"
on storage.objects for delete
using (
  bucket_id = 'pet-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
