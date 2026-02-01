# Debug Storage RLS Checklist

Use these queries in Supabase SQL editor to verify bucket + policy setup for cover uploads.

## A) List buckets
```sql
select id, name, public
from storage.buckets
order by created_at desc;
```

## B) Show cover policies
```sql
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname ilike '%covers%'
order by cmd, policyname;
```

## C) Find any policy that mentions product-covers
```sql
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (qual ilike '%product-covers%' or with_check ilike '%product-covers%');
```

## D) TEMP DEBUG POLICY (authenticated only)
```sql
drop policy if exists "debug insert covers" on storage.objects;
create policy "debug insert covers"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-covers');
```

Remove after testing:
```sql
drop policy if exists "debug insert covers" on storage.objects;
```
