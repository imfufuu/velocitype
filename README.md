# VELOCITYPE

**A neon-outrun typing racer for the browser.** Words speed down the highway toward your hover-racer — lock on with the first matching letter, vaporize the word before it crosses the impact line, chain combos, charge nitro, and outrun your own record.

![genre](https://img.shields.io/badge/genre-typing%20racer-3df5ff)
![stack](https://img.shields.io/badge/stack-React%2019%20%2B%20Vite%20%2B%20Tailwind%204-ff3df0)
![deps](https://img.shields.io/badge/audio%20%2F%20gfx-zero%20assets-ffb54d)
![pwa](https://img.shields.io/badge/PWA-installable%20%2B%20offline-6ff8ff)

## Play

| Input | Action |
| --- | --- |
| `A–Z` | Lock a word / fire a letter |
| `SPACE` | Ignite nitro (when the bar is full) |
| `ESC` | Pause / resume |
| `R` | Instant restart (game over / pause) |
| `M` | Toggle sound (menus) |

On touch devices the native keyboard drives typing (via a hidden input), with on-screen **nitro** and **pause** buttons. The playfield resizes itself above the soft keyboard.

### Difficulty

| Preset | Hull | Pace |
| --- | --- | --- |
| **CRUISE** | 5 | relaxed — slower words, gentler ramp |
| **ARCADE** | 3 | standard |
| **PRO** | 2 | brutal — faster words, quicker ramp, fewer charges |

Your choice is remembered on the device, and the leaderboard tags each entry with the preset it was scored on (C / A / P).

## Features

- **Three difficulty presets** (Cruise / Arcade / Pro) with persistent selection
- **PWA**: installable, with a service worker that keeps the game playable offline after the first visit
- **Share your run** — Web Share API on mobile, clipboard fallback elsewhere
- **Live pause stats** — WPM, accuracy, words, and time while paused
- Juicy feedback: trauma-based screen shake (scaled down for `prefers-reduced-motion` users), per-keystroke lasers, particle bursts, shockwaves, floating score popups, red/cyan flashes, slow-mo wreck sequence
- Combo multiplier (up to x4), nitro boost with triple passive score, configurable hull charges, boss "TURBO" words worth triple
- Difficulty ramp + milestone toasts
- Start screen, countdown, pause, game-over with instant restart
- Local high-score table (top 8, `localStorage`, seeded rivals, arcade name entry, difficulty tags)
- Live WPM window, accuracy, max-chain stats
- Synthesized WebAudio SFX + adaptive engine hum — no audio files
- Canvas renderer with baked offscreen layers (sky / track / vignette + scanlines) and adaptive resolution tiers to hold 60 fps on desktop and mobile
- Unit tests for the game core (word pools, storage, engine rules) via Vitest

## Tech

- **React 19 + TypeScript + Vite**, **Tailwind CSS 4** for UI chrome
- Zero-dependency game core: framework-free engine (`src/game/engine.ts`), hand-rolled canvas renderer (`src/game/renderer.ts`), synth SFX (`src/game/audio.ts`)
- `lucide-react` icons; fonts: Orbitron, Rajdhani, JetBrains Mono
- `vite-plugin-singlefile` inlines the app into one HTML file; `public/` holds the PWA assets (manifest, icons, service worker, OG image)

## Develop

```bash
npm install
npm run dev      # local dev
npm test         # vitest — game-core unit tests
npm run build    # typecheck + single-file production build → dist/
npm run preview  # serve the production build
```

## Deploy

The production build inlines everything into one HTML file, ready to drop onto any static host. Relative asset paths mean it works from any subpath.

### GitHub Pages (configured)

The repo ships with a workflow (`.github/workflows/deploy.yml`) that builds and deploys **every push to `main`**. One-time setup in the GitHub UI:

1. Open the repo → **Settings → Pages**
2. Under **Build and deployment → Source**, select **GitHub Actions**
3. Push to `main` — the site goes live at `https://<user>.github.io/<repo>/`

After the first deploy, test the share link (`https://imfufuu.github.io/velocitype/` is baked into the share text and the OG tags — adjust both if you host elsewhere).

### Anywhere else

`npm run build`, then upload the `dist/` folder to Netlify, Vercel, Cloudflare Pages, S3, or a plain web server. No server-side config needed.

> If you host outside `imfufuu.github.io/velocitype/`, update the absolute URLs in `index.html` (canonical + `og:*`) and the `SHARE_URL` constant in `src/components/Overlays.tsx`.
