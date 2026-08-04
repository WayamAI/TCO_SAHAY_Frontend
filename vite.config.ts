import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

// Served from https://arkabera2004.github.io/locomotive/ — GitHub Pages is
// static-only, so this builds a fully prerendered SPA (no Node server) under
// the /locomotive/ base path. The nitro plugin is intentionally omitted:
// TanStack Start's own static prerendering only works without it.
const base = "/locomotive/";

export default defineConfig({
  base,
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      router: { basepath: base },
      prerender: {
        enabled: true,
        crawlLinks: true,
        autoSubfolderIndex: true,
      },
    }),
    viteReact(),
  ],
});
