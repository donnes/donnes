import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: false,
  },
  site: "https://donnes.dev",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "pt-br"],
  },
  integrations: [tailwind(), mdx(), react(), sitemap()],
});
