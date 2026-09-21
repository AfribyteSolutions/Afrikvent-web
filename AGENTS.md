# Afrikvent — Base44 Development Guide

## Overview
Next.js 15.5 app (App Router) for African event ticketing. Uses Supabase (database + auth), Agora (live streaming), Fapshi (mobile money payments), and Stripe.

## Running the app
```bash
docker compose -f docker-compose.base44.yml up -d
```
- Node 22 runtime, source bind-mounted at `/app`, `npm install && npm run dev` on port 3000.
- Live reload via Next.js dev server with watch polling enabled (`CHOKIDAR_USEPOLLING`, `WATCHPACK_POLLING`).
- Preview origin allowlist handled via `allowedDevOrigins` in `next.config.ts`.

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL` — Supabase project URL (`https://ugzqdabcirvkknkzvzug.supabase.co`). Set in `.env.base44-defaults`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key. **Required to boot** (client created at module load). Generated placeholder exists; replace with real key for data/auth to work.
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key. **Required to boot** (API routes). Generated placeholder exists; replace with real key for payments/tickets/streaming APIs to work.
- `NEXT_PUBLIC_AGORA_APP_ID` / `AGORA_APP_CERTIFICATE` — Optional, needed for live streaming.
- `FAPSHI_API_USER` / `FAPSHI_API_KEY` — Optional, defaults to empty string.
- `NEXT_PUBLIC_APP_URL` — Optional, defaults to `https://afrikvent.com`.

## Key architecture notes
- `src/lib/supabaseClient.js` — singleton Supabase client, imported by Header and all event data hooks. Crashes at module load if URL/anon key are missing.
- `src/hooks/useEvents.ts` — React hooks wrapping `EventService`; all catch errors gracefully and show error/empty states.
- `src/lib/event/eventService.ts` — Supabase queries for events, ticket types, organizer KYC.
- `src/app/api/` — server-side routes for streaming, payments (Fapshi + Stripe), free tickets, promotion banners.
- Large video assets (~44MB) in `public/videos/` — first `npm install` + page load may be slow.

## Verifying the app
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` should return 200.
- Homepage shows a video carousel hero, search bar, and event sections (which will show error/empty states without valid Supabase keys).
- `docker compose -f docker-compose.base44.yml logs --tail 30 web` to check dev server status.
