-- 오늘 민주는: 가족 링크용 저장 칸
-- Supabase 의 SQL Editor 에 이 파일 전체를 붙여 넣고 Run 을 누른다.
--
-- 저장하는 것은 폰에서 잠근 글자(cipher)뿐이다. 푸는 열쇠는 가족 링크 안에만 있어 여기서는 내용을 읽을 수 없다.
-- 쓰기는 처음 만든 폰이 가진 쓰기 열쇠로만 된다. 열쇠 자체는 저장하지 않고 SHA-256 값만 둔다.
-- 표에는 직접 접근하지 못하게 막고, 아래 두 함수로만 넣고 꺼낸다.

create extension if not exists pgcrypto;

create table if not exists public.family_share (
  id          text primary key check (id ~ '^[A-Za-z0-9_-]{20,64}$'),
  cipher      text not null check (length(cipher) <= 200000),
  token_hash  text not null,
  updated_at  timestamptz not null default now()
);

alter table public.family_share enable row level security;
-- 정책을 하나도 만들지 않으므로 anon 사용자는 표를 직접 읽거나 쓸 수 없다.
revoke all on public.family_share from anon, authenticated;

-- 잠근 스케줄 올리기. 처음이면 만들고, 있으면 쓰기 열쇠가 맞을 때만 바꾼다.
create or replace function public.put_family_share(p_id text, p_cipher text, p_token text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text := encode(extensions.digest(p_token, 'sha256'), 'hex');
  v_row public.family_share;
begin
  if p_id !~ '^[A-Za-z0-9_-]{20,64}$' or length(p_token) < 32 then
    raise exception 'bad request';
  end if;
  select * into v_row from public.family_share where id = p_id;
  if not found then
    insert into public.family_share (id, cipher, token_hash) values (p_id, p_cipher, v_hash);
    return now();
  end if;
  if v_row.token_hash <> v_hash then
    raise exception 'wrong token';
  end if;
  update public.family_share set cipher = p_cipher, updated_at = now() where id = p_id;
  return now();
end;
$$;

-- 잠근 스케줄 꺼내기. 링크의 번호를 아는 사람만 꺼낼 수 있고, 꺼내도 열쇠 없이는 못 읽는다.
create or replace function public.get_family_share(p_id text)
returns table (cipher text, updated_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select s.cipher, s.updated_at from public.family_share s where s.id = p_id;
$$;

-- 공유를 그만둘 때 지우기. 쓰기 열쇠가 맞아야 한다.
create or replace function public.delete_family_share(p_id text, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.family_share
   where id = p_id and token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
  return found;
end;
$$;

revoke all on function public.put_family_share(text, text, text) from public;
revoke all on function public.get_family_share(text) from public;
revoke all on function public.delete_family_share(text, text) from public;
grant execute on function public.put_family_share(text, text, text) to anon;
grant execute on function public.get_family_share(text) to anon;
grant execute on function public.delete_family_share(text, text) to anon;
