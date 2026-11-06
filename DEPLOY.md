# Deploying to Cloudflare Pages

The site is a static export (`out/`), so Cloudflare Pages only needs to build it and serve the folder.

## Settings (Workers & Pages → Create → Pages → Connect to Git)

| Setting | Value |
| --- | --- |
| Repository | `FFLY-tt/maple-tail-rescue` |
| Project name | `maple-tail-rescue` (gives `https://maple-tail-rescue.pages.dev`) |
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `out` |
| Root directory | *(leave empty)* |

## Environment variables

Add these under **Settings → Variables and Secrets** for **both Production and Preview**. The build refuses to run if the last two are missing or still placeholders.

| Name | Value |
| --- | --- |
| `NODE_VERSION` | `22` |
| `NEXT_PUBLIC_FORMSPREE_ENDPOINT` | `https://formspree.io/f/xwllzypv` |
| `NEXT_PUBLIC_SITE_URL` | `https://maple-tail-rescue.pages.dev` (the real address, e.g. the custom domain, once known) |

Both `NEXT_PUBLIC_*` values are baked into the site, so changing one needs a new deployment (**Deployments → Retry deployment**, or push a commit).

## Notes

- `public/_headers` sets the security headers (CSP, HSTS and so on). The CSP only allows scripts and styles from the site itself plus `connect-src https://formspree.io`; if the form ever posts somewhere else, update it.
- Animals and photos are committed to the repo. Cloudflare does not run `npm run sync`: after changing animals in WordPress, run it locally, commit `src/data/animals.json` and `public/animals/`, and push.
- Build on Cloudflare (Linux), not with `wrangler pages deploy` from a Windows machine: a Next.js bug on Windows writes the `__next.*.txt` navigation files to the wrong paths in `out/`. The site still works, but client-side navigation falls back to full page loads.
