# Maple Tail Rescue

A demo adoption website for a **fictional foster-based dog and cat rescue in Toronto**. I built it as a volunteer-project pitch for real rescues: a fast public site where adopters can browse animals and apply, and a small staff area for reviewing applications. The rescue, its animals and its social accounts are all made up.

## Screenshots

_Screenshots coming soon._

<!--
Suggested set, saved under docs/screenshots/:
- Home page with the carousel
- Animals list with filters
- Animal detail page
- Application form (mobile)
- Admin applications list
-->

## What it does

- **Public site:** home page with a rotating carousel of animals waiting for homes, a filterable animals list, animal detail pages with sharing and Open Graph metadata, an adoption process page, and a four-step application form.
- **Applications:** stored in Supabase straight from the browser, with a honeypot field and a privacy note.
- **Staff area** (`/admin`): email and password sign-in, a list of applications with a status filter, and a detail page where staff set the status and add notes. Staff accounts are created by hand; there is no sign-up.

## Tech stack and architecture

| Layer | Choice |
| --- | --- |
| Content | Headless WordPress (LocalWP) with Advanced Custom Fields |
| Data pipeline | `npm run sync` script: WordPress REST API → `src/data/animals.json` + photos in `public/animals/` |
| Frontend | Next.js 16 (App Router, **static export**), React 19, TypeScript, Tailwind CSS 4 |
| Forms | React Hook Form + Zod |
| Applications and auth | Supabase (Postgres, Row Level Security, Auth), used from the browser |

```
WordPress + ACF ──sync script──▶ animals.json + photos ──next build──▶ static site (out/)
                                                                           │
                                         browser ◀────── Supabase (applications, staff, auth)
```

The site has no server at runtime. Animal data is baked in at build time, so changes in WordPress show up after running `npm run sync` and rebuilding.

## Key design decisions

- **Decoupled data mapping.** WordPress shapes (ACF fields, media IDs, HTML-encoded titles) are translated into a clean `Animal` type in one place, the sync script. The frontend never sees WordPress, so the CMS could be swapped without touching components. Likewise, `src/lib/application-mapping.ts` is the single place that converts the form's camelCase to the database's snake_case.
- **Static export.** Fast, cheap to host anywhere, and nothing to patch. The trade-offs: no server-side code, and admin pages use a query parameter (`/admin/application?id=…`) instead of dynamic routes.
- **Security comes from Row Level Security only.** The browser holds only the publishable (anon) key, so nothing in the UI can be trusted to protect data. The migration revokes all default privileges and grants back only what is needed:
  - visitors can insert an application (and only the form fields, as a new application with no staff notes), but cannot read, update or delete anything;
  - staff (signed in *and* listed in the `staff` table) can read applications and change only `status` and `staff_notes`; nobody can delete;
  - `CHECK` constraints mirror the Zod schema, so bad data is rejected even if the form is bypassed.

  The `/admin` redirect and "no access" screen are only conveniences; without RLS they would protect nothing.
- **One source of truth for form rules.** `src/lib/application-schema.ts` is plain Zod and drives the form's validation; the database constraints are written to match it.
- **Accessibility built in, not audited.** Semantic HTML, keyboard-operable controls with visible focus rings, labelled form fields with error messages, a skip link, and `prefers-reduced-motion` support. The carousel can be paused, doesn't auto-advance while hovered or keyboard-focused, and only announces slides the visitor changed. I have not run a formal audit or tested with a range of screen readers.

## Local setup

**Requirements:** Node.js 20.9+, [LocalWP](https://localwp.com/), a free [Supabase](https://supabase.com/) project.

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **WordPress (LocalWP).** Create a site at `http://paws-demo.local` (or set `WP_URL` to wherever yours lives). Install the **Advanced Custom Fields** plugin and:
   - register a custom post type with the slug `animal`, REST API enabled, and Featured Image support (the featured image is each animal's main photo);
   - import [`wordpress/acf-animal-fields.json`](wordpress/acf-animal-fields.json) via ACF → Tools → Import Field Groups;
   - add a few published animals.
3. **Sync the animals** (WordPress must be running):
   ```bash
   npm run sync
   ```
   This writes `src/data/animals.json` and saves resized versions of each photo (WebP, plus a JPEG for link previews) into `public/animals/`. The repo already contains a synced copy of the demo data, so you can skip steps 2–3 just to try the site.

   The sync is all-or-nothing: it builds everything in `.sync-staging/`, checks it, and only then swaps it in. If WordPress is down, an animal has an invalid field, a photo can't be downloaded or the result isn't valid, it stops with a message and the previous photos and `animals.json` are left untouched.
4. **Supabase.** Copy `.env.example` to `.env.local` and fill in your project URL and **publishable** key. Never use the `service_role` / secret key in this project. Then run each file in `supabase/migrations/` in order (`001_…`, then `002_…`) by pasting it into the Supabase SQL Editor. To use the admin area, create a user under Authentication → Users, turn off "Allow new users to sign up", and add yourself to the staff table using the commented example at the end of the migration file.
5. **Run it**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000. The admin area is at http://localhost:3000/admin.

`NEXT_PUBLIC_SITE_URL` (the deployed address, used for share previews) isn't needed for `npm run dev`, but it is for a production build; see below.

## Production builds

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SITE_URL` are baked into the built site. To stop a build with a missing or placeholder value from being deployed, `npm run build` (and `next build`) fails with a list of what's wrong if any of them is unset, still a placeholder from `.env.example`, a non-https or local address, or a Supabase *secret* key (which would be published in the site's JavaScript). Dev, `npm run typecheck` and the tests are not affected.

For a throwaway build with dummy values, set `ALLOW_PLACEHOLDER_ENV=1` (CI and the Playwright tests do). Never deploy a build made that way.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build the static site into `out/`. Refuses to run with missing or placeholder config (see Production builds). |
| `npm run sync` | Pull animals and photos from WordPress into `src/data` and `public/animals` |
| `npm run test:rls` | Check the database rules as a signed-out visitor using the publishable key (insert works; read, update, delete and bad data are rejected). Leaves one test row to delete afterwards; the script prints the SQL. |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Generate Next.js route types, then run the TypeScript compiler |
| `npm test` | Unit tests (Vitest): WordPress data mapping, label helpers, sorting, the application schema and its database mapping, the bot-trap decision, and the production-config check |
| `npm run test:e2e` | End-to-end tests (Playwright, Chromium): the public flow (home → animals → filter → detail → apply → success) and the application form's bot trap. They build the site and mock the Supabase insert, so they never touch a real database. First run needs `npx playwright install chromium`. |

## Continuous integration

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request:

- **Checks job:** lint, type-check, unit tests, a step that proves a production build with no config is refused, then the build itself (with `ALLOW_PLACEHOLDER_ENV=1`, since CI has no real Supabase project or site address).
- **End-to-end job:** the Playwright tests against the built site.

It uses no secrets and never runs `test:rls`.

## Limitations

- Not deployed; there is no live demo yet.
- **Tests cover the logic and the main flows, not everything.** There are unit tests for the pure logic, and end-to-end tests for the public application flow and the bot trap. The admin area, the carousel's pause and reduced-motion behaviour, and the failed-submission path are untested.
- **Spam protection is light.** A hidden bot-trap field catches simple bots (it drops a submission only if the trap is filled *and* the form was sent within 3 seconds, so autofill can't lose a real application). There is no CAPTCHA or rate limit, so a determined script with the public key can still add rows. Dropped bot submissions are only logged to the visitor's browser console; there is no server-side record.
- **No notifications.** Applications aren't emailed to staff, and applicants don't get an automatic confirmation; staff see applications only in `/admin`. The success screen says a volunteer will email the applicant, which is a manual step.
- The admin list loads up to 1,000 applications with no pagination or search, and there's no password reset flow.
- Next.js can't optimize images in a static export, so `npm run sync` does it instead: each photo is cropped to 4:5 and saved as an 800px WebP (detail page and home carousel), a 400px WebP (cards) and a JPEG for link previews. There is no per-device `srcset`.
- Animal changes need a re-sync and rebuild; there is no live preview or webhook.
- No privacy policy page or data-retention process yet. Staff cannot delete applications through the app.

## Photo credits

The animal photos come from [Unsplash](https://unsplash.com) and are used under the [Unsplash License](https://unsplash.com/license). Photographers: Baptist Standaert, Victor G, Peri Stojnic, Alvan Nee and Alexander London. The photos are stand-ins for a fictional rescue's animals, and the animals pictured are not real rescue animals.

## License

Released under the [MIT License](LICENSE). The Unsplash photos are not covered by it; see Photo credits above.
