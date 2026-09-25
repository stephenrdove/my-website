# CLAUDE.md

## Project Overview

Personal portfolio website for Stephen Dove, hosted on GitHub Pages at `stephendove.com`. Built with Astro + Tailwind. Deployed automatically on push to `master` and on a Monday morning cron.

## Tech Stack

- **Main site:** Astro 6 + Tailwind CSS 4, built from `site/`
- **Tarot app:** Vite + React, built from `tarot/app/`, deployed to `/tarot/`
- **Tarot worker:** Cloudflare Worker (`tarot/worker/`), deployed separately via `wrangler deploy`
- **Hosting:** GitHub Pages (main site + tarot app together), Cloudflare Workers (tarot backend)

## Project Structure

```
stephendove_site/
├── site/                   # Main Astro site
│   ├── src/
│   │   ├── pages/          # index.astro, music.astro, travel.astro
│   │   │   └── new_horizons/  # Relay running challenge (index, 2024, 2025)
│   │   ├── layouts/        # Layout.astro (shared nav, footer)
│   │   ├── data/           # aotw.ts (Album of the Week schedule)
│   │   └── styles/         # global.css (Tailwind)
│   └── package.json
├── tarot/
│   ├── app/                # Vite + React frontend (builds to /tarot/)
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── cards.ts
│   │   │   ├── components/
│   │   │   └── index.css
│   │   └── vite.config.ts  # base: '/tarot/'
│   └── worker/             # Cloudflare Worker (POST /reading → Anthropic API)
│       ├── src/index.ts
│       └── wrangler.toml
├── 404.html                # Custom error page
├── CNAME                   # Custom domain: stephendove.com
└── .github/workflows/
    └── deploy.yml          # Builds site + tarot/app, deploys to GitHub Pages
```

## Local Development

**Main site:**
```
cd site && npm install && npm run dev
```
Runs on `http://localhost:4321`.

**Tarot app:**
```
cd tarot/app && npm install && npm run dev
```
Needs `VITE_WORKER_URL` in a `.env` file pointing to the worker.

**Tarot worker:**
```
cd tarot/worker && npm install && npx wrangler dev
```
Needs `ANTHROPIC_API_KEY` in `.dev.vars`.

## Deployment

Push to `master` → GitHub Actions builds `site/` and `tarot/app/`, merges tarot into `site/dist/tarot/`, deploys everything to GitHub Pages.

The tarot worker is deployed separately:
```
cd tarot/worker && npx wrangler deploy
```

The Monday cron (`0 10 * * 1`, 5am ET / 10:00 UTC) rebuilds and redeploys the site so the Album of the Week updates automatically.

## Album of the Week

Entries live in `site/src/data/aotw.ts`. Add future entries with `weekOf` set to the Monday of that week (`YYYY-MM-DD`). The build picks the most recent entry whose `weekOf` is on or before the build date.

## Conventions

- Tailwind utility classes throughout the Astro site
- Theme system via `data-theme` on `<html>` (ocean / midnight), stored in localStorage
- Section `id` attributes used for anchor links: `#about`, `#cv`, `#interests`
- Tarot app linked quietly via a `✦` symbol in the footer
