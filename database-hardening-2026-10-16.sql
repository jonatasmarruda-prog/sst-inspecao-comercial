-- Blindagem comercial SST — 16/10/2026
-- Documento de recuperação. Não executar sem revisar o ambiente atual.

create index if not exists idx_sst_access_accounts_company
on public.sst_access_accounts(company_id);

create or replace function private.validate_sst_access_company()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.active is true then
    if not exists (
      select 1
      from public.company_members cm
      join public.companies c on c.id = cm.company_id
      where cm.user_id = new.user_id
        and cm.company_id = new.company_id
        and cm.active = true
        and coalesce(c.commercial_archived,false) = false
    ) then
      raise exception 'commercial access must match an active company membership';
    end if;

    if exists (
      select 1
      from public.company_members cm
      where cm.user_id = new.user_id
        and cm.active = true
        and cm.company_id <> new.company_id
    ) then
      raise exception 'commercial user cannot have active membership in another company';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.validate_sst_access_company() from public;
revoke all on function private.validate_sst_access_company() from anon;
revoke all on function private.validate_sst_access_company() from authenticated;

drop trigger if exists trg_validate_sst_access_company on public.sst_access_accounts;
create trigger trg_validate_sst_access_company
before insert or update of user_id,company_id,active
on public.sst_access_accounts
for each row execute function private.validate_sst_access_company();

create or replace function private.validate_commercial_member_isolation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.active is true and exists (
    select 1
    from public.sst_access_accounts a
    where a.user_id = new.user_id
      and a.active = true
      and a.company_id <> new.company_id
  ) then
    raise exception 'commercial login is already bound to another company';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_commercial_member_isolation() from public;
revoke all on function private.validate_commercial_member_isolation() from anon;
revoke all on function private.validate_commercial_member_isolation() from authenticated;

drop trigger if exists trg_validate_commercial_member_isolation on public.company_members;
create trigger trg_validate_commercial_member_isolation
before insert or update of user_id,company_id,active
on public.company_members
for each row execute function private.validate_commercial_member_isolation();
