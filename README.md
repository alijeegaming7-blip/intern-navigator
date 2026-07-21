# Intern Navigator — Local Development

This project is a TanStack/TanStack Start + Supabase demo app.

## Setup

1. Install dependencies

```bash
npm install
```

2. Environment variables

Create a `.env` file in the project root (or use your environment manager) with the following values:

- `VITE_SUPABASE_URL` — Supabase project URL (client-side)
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable (anon) key (client-side)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side, keep secret)
- `SUPABASE_URL` — Supabase project URL for server (optional if same as VITE_SUPABASE_URL)
- `VITE_USE_MOCK_BACKEND` — Set to `true` to enable the built-in mock backend (dev only)

Example `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx
VITE_USE_MOCK_BACKEND=false
```

Important: Do NOT commit secrets to source control.

## Scripts

- `npm run dev` — Start the dev server (Vite)
- `npm run build` — Build production assets
- `npm run preview` — Preview production build locally
- `npm run lint` — Run eslint

## Mock backend

The project includes a mock Supabase backend used for local development and demos. It is only enabled when `VITE_USE_MOCK_BACKEND=true`. By default the application will use your real Supabase credentials if present — set `VITE_USE_MOCK_BACKEND=true` to explicitly use the demo data.

## Running locally with real Supabase

1. Ensure you have `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` set.
2. Start dev server:

```bash
npm run dev
```

3. Open `http://localhost:5173` (or the host/port Vite reports).

## Next steps

- Add CI checks (lint/build)
- Provide seed SQL or a script for Supabase migrations
- Configure environment management for secure server keys

If you want, I can also add a scripted seeder and a small `dev:mock` script that runs with `VITE_USE_MOCK_BACKEND=true` enabled.
