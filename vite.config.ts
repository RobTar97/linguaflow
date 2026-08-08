import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { seoStaticPages } from "./scripts/seo-static-pages";
import packageJson from "./package.json";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const publicSiteUrl =
    env.PUBLIC_SITE_URL || "https://linguaflow.example";

  return {
    plugins: [
      react(),
      seoStaticPages(publicSiteUrl),
      VitePWA({
        registerType: "prompt",
        injectRegister: null,
        filename: "app/sw.js",
        scope: "/app/",
        manifest: false,
        workbox: {
          cleanupOutdatedCaches: true,
          globPatterns: ["**/*.{html,js,css,png,jpg,jpeg,webp,svg,woff2,json}"],
          navigateFallback: "/app/index.html",
          navigateFallbackAllowlist: [/^\/app(?:\/|$)/],
          runtimeCaching: [
            { urlPattern: /\/api\//, handler: "NetworkOnly", method: "GET" },
            { urlPattern: /\.(?:png|jpg|jpeg|webp|svg|woff2)$/i, handler: "CacheFirst", options: { cacheName: `linguaflow-media-${packageJson.version}`, expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 } } },
          ],
        },
      }),
    ],
    define: { __APP_VERSION__: JSON.stringify(packageJson.version) },
  };
});
