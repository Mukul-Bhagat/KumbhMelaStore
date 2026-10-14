begin;

do $$
declare
  target_user_id uuid;
  target_user_count integer;
  super_admin_role_id uuid;
begin
  select count(*)
  into target_user_count
  from auth.users
  where lower(email) = lower('kumbhmelamukul@kumbhmelastore.in')
    and deleted_at is null;

  if target_user_count = 0 then
    raise exception 'No active Auth account exists for kumbhmelamukul@kumbhmelastore.in. Create or invite that exact account in Supabase Auth, then rerun this script.';
  end if;

  if target_user_count <> 1 then
    raise exception 'Expected exactly one active Auth account for kumbhmelamukul@kumbhmelastore.in; found %.', target_user_count;
  end if;

  select id
  into target_user_id
  from auth.users
  where lower(email) = lower('kumbhmelamukul@kumbhmelastore.in')
    and deleted_at is null;

  select id
  into super_admin_role_id
  from public.roles
  where slug = 'super_admin';

  if super_admin_role_id is null then
    raise exception 'The super_admin role is missing. Apply the database migration and seed the roles before granting access.';
  end if;

  insert into public.user_roles (user_id, role_id, granted_by)
  values (target_user_id, super_admin_role_id, null)
  on conflict (user_id, role_id) do nothing;
end;
$$;

commit;

select
  exists (
    select 1
    from auth.users
    where lower(email) = lower('kumbhmelamukul@kumbhmelastore.in')
      and deleted_at is null
  ) as auth_user_exists,
  exists (
    select 1
    from auth.users
    where lower(email) = lower('kumbhmelamukul@kumbhmelastore.in')
      and deleted_at is null
      and email_confirmed_at is not null
  ) as email_confirmed,
  exists (
    select 1
    from auth.users user_row
    join public.user_roles user_role on user_role.user_id = user_row.id
    join public.roles role on role.id = user_role.role_id
    where lower(user_row.email) = lower('kumbhmelamukul@kumbhmelastore.in')
      and user_row.deleted_at is null
      and role.slug = 'super_admin'
  ) as super_admin_role_granted,
  exists (
    select 1
    from auth.users user_row
    join public.profiles profile on profile.id = user_row.id
    where lower(user_row.email) = lower('kumbhmelamukul@kumbhmelastore.in')
      and user_row.deleted_at is null
  ) as profile_exists;
