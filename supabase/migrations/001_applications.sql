-- Maple Tail Rescue: adoption applications and staff access.
--
-- Paste this whole file into the Supabase SQL Editor and run it once.
--
-- The site is a static export and talks to Supabase straight from the browser
-- with the publishable (anon) key, so Row Level Security (RLS) and the column
-- grants below are the ONLY thing protecting the data. The CHECK constraints
-- mirror src/lib/application-schema.ts, so bad data is rejected even if
-- someone calls the API directly and skips the form.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.applications (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Contact
  full_name           text not null,
  email               text not null,
  phone               text not null,

  -- Home
  ownership           text not null,
  landlord_permission text,          -- only answered when renting

  -- Household
  adults              text not null,
  children            text not null,
  household_agrees    text not null,

  -- Current pets
  has_pets            text not null,
  current_pets        text,          -- only answered when has_pets = 'yes'

  -- Experience
  experience          text not null,

  -- Animal (animal_slug and animal_name are both NULL for "No specific animal yet")
  animal_slug         text,
  animal_name         text,
  why_interested      text not null,

  -- Staff only
  status              text not null default 'new',
  staff_notes         text not null default '',

  -- Contact
  constraint applications_full_name_check check (
    char_length(btrim(full_name)) between 1 and 100
    and full_name ~ '[[:alpha:]]'                      -- at least one letter ("645" is rejected)
  ),
  constraint applications_email_check check (
    char_length(email) <= 200
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  constraint applications_phone_check check (
    phone ~ '^[0-9[:space:]()+.-]+$'
    and char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 10 and 15
  ),

  -- Home
  constraint applications_ownership_check check (ownership in ('own', 'rent')),
  -- Note: a CHECK passes when it evaluates to NULL, so NULL is tested explicitly below.
  constraint applications_landlord_check check (
    (ownership = 'rent' and landlord_permission is not null and landlord_permission in ('yes', 'no'))
    or (ownership = 'own' and landlord_permission is null)
  ),

  -- Household
  constraint applications_adults_check check (adults in ('1', '2', '3', '4-plus')),
  constraint applications_children_check check (children in ('0', '1', '2', '3-plus')),
  constraint applications_household_agrees_check check (household_agrees in ('yes', 'no')),

  -- Current pets
  constraint applications_has_pets_check check (has_pets in ('yes', 'no')),
  constraint applications_current_pets_check check (
    (has_pets = 'yes' and current_pets is not null and char_length(btrim(current_pets)) between 1 and 500)
    or (has_pets = 'no' and current_pets is null)
  ),

  -- Experience
  constraint applications_experience_check check (char_length(btrim(experience)) between 1 and 1000),

  -- Animal
  constraint applications_animal_check check (
    (animal_slug is null and animal_name is null)
    or (
      animal_slug is not null and animal_name is not null
      and char_length(animal_slug) between 1 and 100
      and char_length(animal_name) between 1 and 100
    )
  ),
  constraint applications_why_interested_check check (char_length(btrim(why_interested)) between 10 and 1000),

  -- Staff only
  constraint applications_status_check check (
    status in ('new', 'in_review', 'interviewed', 'approved', 'declined', 'withdrawn')
  ),
  constraint applications_staff_notes_check check (char_length(staff_notes) <= 5000)
);

create index applications_created_at_idx on public.applications (created_at desc);
create index applications_status_idx on public.applications (status);

-- Only users listed here are staff. Rows are added by hand (see the end of this file).
create table public.staff (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Privileges (column level, on top of RLS)
--
-- Supabase grants new tables to anon/authenticated by default, so start from
-- nothing and grant back only what is needed.
-- ---------------------------------------------------------------------------

revoke all on table public.applications from anon, authenticated;
revoke all on table public.staff from anon, authenticated;

-- Applicants (signed out, or a signed-in person) may insert the form fields only.
-- id, created_at, updated_at, status and staff_notes always take their defaults.
grant insert (
  full_name, email, phone,
  ownership, landlord_permission,
  adults, children, household_agrees,
  has_pets, current_pets,
  experience,
  animal_slug, animal_name, why_interested
) on table public.applications to anon, authenticated;

-- Staff can read everything and change only status and staff_notes. No DELETE.
grant select on table public.applications to authenticated;
grant update (status, staff_notes) on table public.applications to authenticated;

-- Signed-in users can look for their own staff row. Nobody can write it through the API.
grant select on table public.staff to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.applications enable row level security;
alter table public.staff enable row level security;

-- Anyone can submit an application, but only as a brand-new one with no staff notes.
-- Includes "authenticated" so a staff member who is signed in can still use the public form.
create policy "Anyone can submit an application"
  on public.applications
  for insert
  to anon, authenticated
  with check (status = 'new' and staff_notes = '');

-- Staff = signed in AND listed in public.staff.
create policy "Staff can read applications"
  on public.applications
  for select
  to authenticated
  using (exists (select 1 from public.staff s where s.user_id = (select auth.uid())));

create policy "Staff can update applications"
  on public.applications
  for update
  to authenticated
  using (exists (select 1 from public.staff s where s.user_id = (select auth.uid())))
  with check (exists (select 1 from public.staff s where s.user_id = (select auth.uid())));

-- No SELECT policy for anon, and no DELETE policy for anyone: those are denied.

create policy "Users can read their own staff row"
  on public.staff
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- No INSERT/UPDATE/DELETE policies on staff: nobody can change it through the API.

-- ---------------------------------------------------------------------------
-- Make yourself staff (run AFTER creating your user in Authentication > Users).
-- Uncomment, put in your email, and run it in the SQL Editor.
-- ---------------------------------------------------------------------------

-- insert into public.staff (user_id)
-- select id from auth.users where email = 'you@example.com';
