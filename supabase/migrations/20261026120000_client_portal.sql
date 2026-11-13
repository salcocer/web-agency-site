-- Client portal schema.
--
-- A client is a company (the billing entity). People log in as profiles that belong
-- to one client. Each client has projects (their websites), milestones, change
-- requests with a message thread, one-time charges and Stripe subscriptions.
--
-- Row level security keeps every client to its own rows. Staff are profiles with
-- role = 'admin' and can read and change everything. Stripe webhooks and invites
-- write with the secret key, which bypasses RLS.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('client', 'admin');
create type public.project_status as enum ('discovery', 'design', 'build', 'review', 'live', 'paused');
create type public.request_status as enum ('open', 'in_progress', 'done');
create type public.charge_status as enum ('due', 'paid', 'void');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'client',
  client_id uuid references public.clients (id) on delete set null,
  created_at timestamptz not null default now()
);
create index profiles_client_id_idx on public.profiles (client_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  site_url text,
  package text,
  status public.project_status not null default 'discovery',
  launch_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_client_id_idx on public.projects (client_id);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index milestones_project_id_idx on public.milestones (project_id);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  status public.request_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index requests_project_id_idx on public.requests (project_id);
create index requests_author_id_idx on public.requests (author_id);

create table public.request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);
create index request_messages_request_id_idx on public.request_messages (request_id);
create index request_messages_author_id_idx on public.request_messages (author_id);

-- A one-time amount a client owes, paid through Stripe Checkout.
create table public.charges (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  description text not null check (char_length(description) between 1 and 300),
  amount integer not null check (amount > 0), -- smallest currency unit, so satang for THB
  currency text not null default 'thb',
  status public.charge_status not null default 'due',
  checkout_session_id text,
  payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index charges_client_id_idx on public.charges (client_id);
create index charges_project_id_idx on public.charges (project_id);

-- Mirror of Stripe subscriptions, written only by the Stripe webhook.
create table public.subscriptions (
  id text primary key, -- Stripe subscription id
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  status text not null, -- Stripe status: active, past_due, canceled, ...
  price_id text,
  plan_name text,
  amount integer,
  currency text,
  interval text,
  current_period_end timestamptz,
  cancel_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_client_id_idx on public.subscriptions (client_id);
create index subscriptions_project_id_idx on public.subscriptions (project_id);

-- Messages from the public contact form, written by a server action.
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  business text,
  need text,
  message text check (char_length(message) <= 5000),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper functions (private schema, not exposed through the API)
-- ---------------------------------------------------------------------------

create function private.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create function private.my_client_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select client_id from public.profiles where id = (select auth.uid());
$$;

create function private.can_see_project(project uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_admin() or exists (
    select 1 from public.projects
    where id = project and client_id = private.my_client_id()
  );
$$;

create function private.can_see_request(request uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.requests
    where id = request and private.can_see_project(project_id)
  );
$$;

create function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, coalesce(new.email, ''));
  return new;
end;
$$;

create function private.handle_user_email_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create function private.touch_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- A new message counts as activity on its request. Security definer because
-- clients may add messages but may not update requests themselves.
create function private.touch_request_on_message()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.requests set updated_at = now() where id = new.request_id;
  return new;
end;
$$;

revoke all on all functions in schema private from public, anon;
grant usage on schema private to authenticated, service_role;
grant execute on function private.is_admin(), private.my_client_id(),
  private.can_see_project(uuid), private.can_see_request(uuid)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function private.handle_user_email_change();

create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function private.touch_updated_at();

create trigger requests_touch_updated_at
  before update on public.requests
  for each row execute function private.touch_updated_at();

create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function private.touch_updated_at();

create trigger request_messages_touch_request
  after insert on public.request_messages
  for each row execute function private.touch_request_on_message();

-- ---------------------------------------------------------------------------
-- Privileges and row level security
-- ---------------------------------------------------------------------------

-- Nothing here is public. Logged-out visitors only reach the contact form,
-- which inserts through a server action with the secret key.
revoke all on public.clients, public.profiles, public.projects, public.milestones,
  public.requests, public.request_messages, public.charges, public.subscriptions,
  public.enquiries
  from anon;

-- People may change their own name, nothing else on their profile.
-- Role and client membership are changed by staff through the secret key.
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Subscriptions are written only by the Stripe webhook.
revoke insert, update, delete on public.subscriptions from authenticated;

alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.milestones enable row level security;
alter table public.requests enable row level security;
alter table public.request_messages enable row level security;
alter table public.charges enable row level security;
alter table public.subscriptions enable row level security;
alter table public.enquiries enable row level security;

-- clients
create policy "Members and staff can read a client" on public.clients
  for select to authenticated
  using (id = (select private.my_client_id()) or (select private.is_admin()));
create policy "Staff can add clients" on public.clients
  for insert to authenticated with check ((select private.is_admin()));
create policy "Staff can edit clients" on public.clients
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Staff can delete clients" on public.clients
  for delete to authenticated using ((select private.is_admin()));

-- profiles
-- Clients see their own team and the studio's staff (who reply on requests);
-- staff see everyone.
create policy "People can read their team and staff" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or role = 'admin'
    or (select private.is_admin())
    or (client_id is not null and client_id = (select private.my_client_id()))
  );
create policy "People can edit their own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- projects
create policy "Clients read their projects, staff read all" on public.projects
  for select to authenticated
  using (client_id = (select private.my_client_id()) or (select private.is_admin()));
create policy "Staff can add projects" on public.projects
  for insert to authenticated with check ((select private.is_admin()));
create policy "Staff can edit projects" on public.projects
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Staff can delete projects" on public.projects
  for delete to authenticated using ((select private.is_admin()));

-- milestones
create policy "Readable with the project" on public.milestones
  for select to authenticated using (private.can_see_project(project_id));
create policy "Staff can add milestones" on public.milestones
  for insert to authenticated with check ((select private.is_admin()));
create policy "Staff can edit milestones" on public.milestones
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Staff can delete milestones" on public.milestones
  for delete to authenticated using ((select private.is_admin()));

-- requests
create policy "Readable with the project" on public.requests
  for select to authenticated using (private.can_see_project(project_id));
create policy "Clients and staff can open requests on visible projects" on public.requests
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and private.can_see_project(project_id)
    and (status = 'open' or (select private.is_admin()))
  );
create policy "Staff can edit requests" on public.requests
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Staff can delete requests" on public.requests
  for delete to authenticated using ((select private.is_admin()));

-- request_messages
create policy "Readable with the request" on public.request_messages
  for select to authenticated using (private.can_see_request(request_id));
create policy "Anyone who can see a request can reply" on public.request_messages
  for insert to authenticated
  with check (author_id = (select auth.uid()) and private.can_see_request(request_id));
create policy "Staff can delete messages" on public.request_messages
  for delete to authenticated using ((select private.is_admin()));

-- charges
create policy "Clients read their charges, staff read all" on public.charges
  for select to authenticated
  using (client_id = (select private.my_client_id()) or (select private.is_admin()));
create policy "Staff can add charges" on public.charges
  for insert to authenticated with check ((select private.is_admin()));
create policy "Staff can edit charges" on public.charges
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Staff can delete charges" on public.charges
  for delete to authenticated using ((select private.is_admin()));

-- subscriptions
create policy "Clients read their subscriptions, staff read all" on public.subscriptions
  for select to authenticated
  using (client_id = (select private.my_client_id()) or (select private.is_admin()));

-- enquiries
create policy "Staff can read enquiries" on public.enquiries
  for select to authenticated using ((select private.is_admin()));
create policy "Staff can delete enquiries" on public.enquiries
  for delete to authenticated using ((select private.is_admin()));
