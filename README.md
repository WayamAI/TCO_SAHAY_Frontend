# Locomotive Wayam Intelligence

TCO simulation, forecasting, and risk intelligence platform for locomotive fleets, built by Wayam AI.

## Live site

- **GitHub Pages:** https://arkabera2004.github.io/locomotive/
- **Vercel:** https://locomotivewabtec-main.vercel.app

The GitHub Pages build is a fully static, prerendered single-page app — every route in the sidebar (Command Center, Fleet Explorer, BOM Explorer, Simulation, Forecasting, Monte Carlo, etc.) is pre-generated to static HTML and hydrates client-side. It redeploys automatically on every push to `main` via [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

The Vercel deployment runs the same app as a full Node SSR server (via Nitro's `vercel` preset) at the domain root — `vite.config.ts` detects the `VERCEL` build environment variable and switches the base path and build mode automatically, so both targets build from the same source without manual config changes.

## Running locally

Requires [Bun](https://bun.sh).

```bash
bun install
bun run dev
```

The dev server prints a local URL (defaults to `http://localhost:3000`, falls back to the next free port).

## Building for production

```bash
bun run build
```

Outputs a fully static site to `dist/client/`, prerendered with the `/locomotive/` base path (matching the GitHub Pages project URL) and a `404.html` fallback so client-side routing works for direct/deep links.

To sanity-check the static output locally, serve `dist/client/` with any static file server — `vite preview` won't work here since this build has no server, by design.

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing) in static-SPA mode — no Node server at runtime
- Tailwind CSS v4
- Zustand for simulation state
- Recharts for data visualization
