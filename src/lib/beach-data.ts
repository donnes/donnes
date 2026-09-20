import { type CollectionEntry, getCollection } from "astro:content";

import { CITY, SITE } from "../constants";
import { useTranslations } from "./i18n";
import type { Language } from "./i18n/translations";

// "cv.summary" is the long CV paragraph; the homepage uses its first two sentences.
const firstSentences = (text: string, n: number) =>
  text
    .split(/(?<=\.)\s+/)
    .slice(0, n)
    .join(" ");

export function getProfile(lang: Language) {
  const t = useTranslations(lang);
  return {
    name: SITE.TITLE,
    // the headline stays in English in every language
    role: SITE.ROLE,
    city: CITY,
    cityLink: SITE.CITY_LINK,
    email: SITE.EMAIL,
    cvLink: SITE.CV_LINK,
    photo: "/me.jpg",
    tagline: t("home.hero.description.2"),
    summary: firstSentences(t("cv.summary"), 2),
    socials: [
      { label: "GitHub", handle: "donnes", href: "https://github.com/donnes" },
      {
        label: "LinkedIn",
        handle: "donaldsilveira",
        href: "https://linkedin.com/in/donaldsilveira",
      },
      {
        label: "X",
        handle: "@donaldsilveira",
        href: "https://x.com/donaldsilveira",
      },
    ],
  };
}

export type StackGroup = {
  group: string;
  items: string[];
  featured?: boolean;
  note?: string;
};

type Localized = Record<Language, string>;
const l = (en: string, pt: string): Localized => ({ en, "pt-br": pt });

// items are proper nouns unless given as a localized pair
const STACK: {
  group: Localized;
  items: (string | Localized)[];
  featured?: boolean;
  note?: Localized;
}[] = [
  {
    group: l("AI & Agents", "IA e agentes"),
    featured: true,
    note: l(
      "Agents in the product and in the workflow.",
      "Agentes no produto e no fluxo de trabalho.",
    ),
    items: [
      "Claude Code",
      "Agent Skills & Plugins",
      "MCP",
      "Vercel AI SDK",
      "Mastra",
      "OpenRouter",
      l("Claude & OpenAI APIs", "APIs do Claude e da OpenAI"),
      l("Voice agents", "Agentes de voz"),
      "n8n",
    ],
  },
  {
    group: l("Product engineering", "Engenharia de produto"),
    items: ["TypeScript", "React", "Next.js", "Astro", "React Native", "Expo"],
  },
  {
    group: l("Data & realtime", "Dados e tempo real"),
    items: [
      "TanStack Query",
      "tRPC",
      "Zod",
      "Zustand",
      l("SSE streaming", "Streaming via SSE"),
    ],
  },
  {
    group: l("Backend", "Backend"),
    items: ["Node.js", "Bun", "Python", "Go", "PostgreSQL", "Redis"],
  },
  {
    group: l("UI systems", "Sistemas de UI"),
    items: ["Tailwind CSS", "Radix UI", "Base UI", "shadcn/ui"],
  },
  {
    group: l("Quality", "Qualidade"),
    items: [
      "Playwright",
      "Vitest",
      "Biome",
      "Sentry",
      l("Sharded CI", "CI com sharding"),
    ],
  },
  {
    group: l("Platform", "Plataforma"),
    items: [
      "Vercel",
      "Cloudflare",
      "AWS",
      "GCP",
      "Docker",
      "GitHub Actions",
      "Turborepo",
    ],
  },
];

export function getStack(lang: Language): StackGroup[] {
  return STACK.map((g) => ({
    group: g.group[lang],
    featured: g.featured,
    note: g.note?.[lang],
    items: g.items.map((it) => (typeof it === "string" ? it : it[lang])),
  }));
}

/** Roles in one language, newest first (files are numbered 1-… from the newest). */
export async function getExperiences(
  lang: Language,
): Promise<CollectionEntry<"experiences">[]> {
  const all = await getCollection("experiences");
  return all
    .filter((entry) => entry.slug.startsWith(`${lang}/`))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}
