# Noctilume

A web app for reporting, viewing, and managing light pollution incidents.

## Requirements

- Node.js 20+
- A Supabase project only if you want to enable the connected app

## Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3000/demo](http://localhost:3000/demo). No environment file or credentials are needed for the demo.

## Demo without credentials

You can try the interface without configuring Supabase. Run `npm run dev` and open [http://localhost:3000/demo](http://localhost:3000/demo). If the Supabase environment variables are missing, the home page automatically shows the demo as well.

The demo uses fictional incidents. You can search, filter, focus map markers, and change statuses temporarily; it does not save data or require signing in. The base map requires an internet connection.

## Environment variables

To enable the Supabase-connected app, copy `.env.example` to `.env.local`, add your project values, and restart the dev server:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Variables

- `NEXT_PUBLIC_SUPABASE_URL`: your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: your Supabase publishable key.
- `NEXT_PUBLIC_BASE_URL`: site URL used for redirects.

## Run locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Useful commands

```bash
npm run build
npm run lint
```

