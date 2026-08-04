import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

// Two deployment targets share this config:
//  - Vercel (VERCEL env var is set automatically in Vercel's build environment):
//    full Node SSR at the domain root via nitro's "vercel" preset.
//  - Everything else (local build, GitHub Actions -> GitHub Pages): GitHub Pages
//    is static-only, so this builds a fully prerendered SPA (no Node server)
//    under the /locomotive/ base path. TanStack Start's static prerendering
//    only works without the nitro plugin, so it's omitted for this target.
const isVercel = !!process.env.VERCEL;
const base = isVercel ? "/" : "/locomotive/";

export default defineConfig({
  base,
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart(
      isVercel
        ? {
            // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
            server: { entry: "server" },
            router: { basepath: base },
          }
        : {
            router: { basepath: base },
            prerender: { enabled: true, crawlLinks: true, autoSubfolderIndex: true },
          },
    ),
    ...(isVercel ? [nitro({ preset: "vercel" })] : []),
    viteReact(),
  ],
});
