-- Reject "?" and "&" in applicant email addresses.
--
-- Run after 001_applications.sql, in the Supabase SQL Editor.
--
-- Why: the admin page turns the email into a mailto: link. An address such as
-- "a@b.co?bcc=someone@else.com" would add a hidden recipient to the staff member's
-- new message. The form already refuses these characters, but the database must
-- too, because anyone can call the API without the form. (The admin page now also
-- percent-encodes the address, so this is a second layer.)
--
-- NOT VALID: existing rows are not re-checked, so this can't fail on data that is already
-- there. But the rule IS enforced whenever a row is inserted or updated, so an existing row
-- whose email has "?" or "&" can't be changed (not even its status) until the email is
-- corrected. Most databases have none. To find and clean up any:
--   select id, full_name, email from public.applications where email ~ '[?&]';
--   update public.applications set email = '<corrected address>' where id = '<id>';
--   alter table public.applications validate constraint applications_email_check;  -- once none are left

alter table public.applications drop constraint applications_email_check;

alter table public.applications add constraint applications_email_check check (
  char_length(email) <= 200
  and email ~ '^[^@[:space:]?&]+@[^@[:space:]?&]+\.[^@[:space:]?&]+$'
) not valid;
