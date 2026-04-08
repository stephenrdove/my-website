# CLAUDE.md

## Project Overview

Personal portfolio website for Stephen Dove, hosted on GitHub Pages at `stephendove.com`. Static HTML/CSS site — no build step, no package manager, no compilation.

## Tech Stack

- **HTML/CSS** — plain static files
- **Bootstrap 5.3.3** — primary CSS framework (CDN-hosted)
- **Bootstrap Icons 1.11.3** — icon library (CDN-hosted)
- **Vanilla JavaScript** — Bootstrap's bundle.min.js for interactivity (modals, navbar)
- **Custom CSS** — minimal overrides in `/css/style.css`

## Project Structure

```
stephendove_site/
├── index.html          # Main homepage (About, CV, Interests sections)
├── cv.html             # Legacy résumé page (Bootstrap 4, not linked from nav)
├── add.html            # Interests stub page
├── 404.html            # Custom error page
├── CNAME               # Custom domain: stephendove.com
├── css/
│   └── style.css       # Minimal custom styles (~25 lines)
├── images/             # Static image assets + favicons
└── new_horizons/       # Sub-site for relay running challenge
    ├── 2024.html       # 2024 New Horizons Challenge details & results
    └── 2025.html       # 2025 challenge planning
```

## Local Development

No install step needed. Serve locally with:

- **VS Code LiveServer** (configured on port 5501 via `.vscode/settings.json`) — recommended
- Or: `python -m http.server 5501`

## Deployment

Push to `master` branch → GitHub Pages automatically deploys to `stephendove.com`.

## Conventions

- Bootstrap utility classes for layout and spacing (`container-lg`, `row`, `col-md-*`, `py-5`, `fw-bold`, etc.)
- Section `id` attributes used for anchor links: `#about`, `#cv`, `#interests`
- Images use `img-fluid` for responsiveness
- Bootstrap modals for expandable content (e.g., interest cards on homepage)
- Consistent navbar across all pages linking to About, CV, Interests, and GitHub
