# Daily Tarot Reading — Project Brief

A small web app attached to **stevendove.com** that lets a visitor draw a daily three-card tarot spread and receive an LLM-generated reading. One reading per browser per day.

## Tech Stack

- **Frontend:** Vite + React, deployed to GitHub Pages via GitHub Actions
- **Backend:** Cloudflare Worker (free tier) acting as an API-key-hiding proxy
- **LLM:** Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- **Rate limiting:** `localStorage` on the client (date check), plus per-IP rate limit on the Worker as a backstop
- **Card data:** `cards.js` (provided separately — 78 cards with upright/reversed meanings and a `drawCards(n)` helper)

## Repo Layout

The site lives at `github.com/stevendove/<site-repo>`. The tarot app should slot in cleanly — likely as its own subdirectory that builds to `/tarot/` on the deployed site. Confirm with me how the existing GitHub Pages setup is structured before deciding between a subdirectory build vs. a separate repo.

The Cloudflare Worker should be its own folder (`tarot-worker/`) with its own `wrangler.toml`, deployed separately via `wrangler deploy`.

## Functional Requirements

1. **Landing view:** brief explanation of what this is, a single "Draw your cards" button.
2. **Draw animation:** call `drawCards(3)` and reveal the three cards one at a time in a Past / Present / Future spread. Show card name, orientation (upright/reversed), and keywords as tags.
3. **Reading view:** show a loading state, then stream or display the LLM-generated reading below the cards.
4. **Daily limit:** on successful reading, store today's date in `localStorage` under a key like `tarot:lastReading`. On page load, if today's date matches, show the previous reading (also cached in `localStorage`) instead of allowing a new draw. Include a small "Come back tomorrow" message and a countdown to local midnight.
5. **Reset for testing:** include a hidden dev-only way to clear the localStorage limit (e.g., `?reset=1` query param, or only enabled when `import.meta.env.DEV`).

## Cloudflare Worker Spec

- `POST /reading` endpoint
- Accepts JSON body: `{ cards: [{ name, position, orientation, meaning }, ...] }`
- Constructs the prompt server-side (don't trust the client to send the prompt)
- Calls Anthropic's `/v1/messages` endpoint with the API key from a Worker secret (`ANTHROPIC_API_KEY`)
- Returns the model's text response as JSON: `{ reading: "..." }`
- CORS: allow only `https://stevendove.com` (and `http://localhost:5173` for dev)
- Rate limit: use Cloudflare's rate limiting binding, ~5 requests per IP per day

## Prompt Template (server-side)

```
You are an insightful tarot reader giving a three-card past/present/future reading.

The querent drew:

PAST: {name}{ " (reversed)" if reversed }
  Traditional meaning: {meaning}

PRESENT: {name}{ " (reversed)" if reversed }
  Traditional meaning: {meaning}

FUTURE: {name}{ " (reversed)" if reversed }
  Traditional meaning: {meaning}

Write a flowing three-paragraph reading (one paragraph per position) that
weaves these cards into a coherent narrative. Address the querent as "you".
Let the cards inform the story rather than listing meanings mechanically.
End with one grounded reflection or question for them to sit with today.
Tone: warm, thoughtful, not sycophantic. Avoid em-dashes.
```

## Design Notes

- Visual style: I like a slightly mystical but clean aesthetic — dark background, warm accent color (deep gold or amber), serif headings, sans-serif body. No stock tarot-mystic clip art.
- Cards can be CSS-styled rectangles with the card name and a simple symbol/emoji per suit at first; we can add real card art later.
- Reversed cards should be visually rotated 180° so the orientation is obvious.
- Mobile-first — most people will hit this on a phone.

## What I'd Like Help With (in this order)

1. Set up the Vite + React project with the right `base` config for GitHub Pages
2. Build the React UI (landing → draw → reading) using the provided `cards.js`
3. Write the Cloudflare Worker and `wrangler.toml`
4. Wire up the GitHub Actions deploy workflow
5. Add the daily-limit logic and previous-reading cache

Skip MVP polish on round one — get the end-to-end loop working, then we'll iterate.

## My Background

Intermediate web dev — comfortable with HTML/CSS/JS, less day-to-day with React and zero experience with Cloudflare Workers. Explain Worker setup and any non-obvious React patterns as you go. Push back if I make a bad call.
