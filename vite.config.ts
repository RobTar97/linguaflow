import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { seoStaticPages } from "./scripts/seo-static-pages";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const publicSiteUrl =
    env.PUBLIC_SITE_URL || "https://linguaflow.example";

  return {
    plugins: [react(), seoStaticPages(publicSiteUrl)],
  };
});
