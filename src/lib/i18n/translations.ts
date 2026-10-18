import { CITY } from "../../constants";

export const languages = {
  en: "English",
  "pt-br": "Português (Brasil)",
};

export type Language = keyof typeof languages;

export const defaultLang = "en";

export const translations = {
  en: {
    // Home
    "home.hero.description.1": `I'm an AI Product Engineer based in <strong itemprop="addressLocality">${CITY}</strong>.`,
    "home.hero.description.2":
      "What satisfies me most is building amazing products that make people and businesses prosper.",
    "home.experience.title": "Work Experience",
    "about.summary":
      "I build AI agents that run in production. At Levers (YC S22), I'm building inbound and outbound voice agents for accounts receivable and sales, in English and Arabic. Before AI, I spent 15 years shipping web and mobile across fintech, e-commerce and SaaS.",
    "about.architecture":
      "Focused on system architecture: distributed systems, real-time pipelines, and scaling agent workloads reliably.",

    // Colophon
    "colophon.tecnology.title": "Tech Stack",
    "colophon.tecnology.description": `To build this site I have opt to use a small set of tools, but that are powerful for building small websites, those tools include <a href="https://astro.build" target="_blank">Astro</a>, <a href="https://tailwindcss.com" target="_blank">Tailwind CSS</a>, <a href="https://ui.shadcn.com" target="_blank">Shadcn UI</a> and <span class="text-zinc-800 dark:text-zinc-400">TypeScript</span>.`,
    "colophon.typography.title": "Typography",
    "colophon.typography.description": `This site uses the Vercel <a href="https://vercel.com/font" target="_blank">Geist</a> typeface, which is a free and open-source typeface specifically designed for developers and designers.`,
    "colophon.inspiration.title": "Inspiration",
    "colophon.inspiration.description":
      "During the development of this site, I was inspired by many amazing developers and designers, so they deserve to be mentioned here.",

    // 404
    "404.title": "404 Not Found",
    "404.description": "The page you are looking for could not be found.",
    "404.back-home": "Back to home",

    // Common
    "common.back": "Back",
  },
  "pt-br": {
    // Home
    "home.hero.description.1": `Sou AI Product Engineer e atualmente moro em <strong itemprop="addressLocality">${CITY}</strong>.`,
    "home.hero.description.2":
      "O que mais me satisfaz é construir produtos incríveis que fazem pessoas e negócios prosperarem.",
    "home.experience.title": "Experiência",
    "about.summary":
      "Construo agentes de IA que rodam em produção. Na Levers (YC S22), estou construindo agentes de voz inbound e outbound para contas a receber e vendas, em inglês e árabe. Antes da IA, passei 15 anos entregando produtos web e mobile em fintech, e-commerce e SaaS.",
    "about.architecture":
      "Foco em arquitetura de sistemas: sistemas distribuídos, pipelines em tempo real e escalar cargas de trabalho de agentes com confiabilidade.",

    // Colophon
    "colophon.tecnology.title": "Tecnologia",
    "colophon.tecnology.description": `Ao construir esse site, eu optei por usar poucas ferramentas, mas que são poderosas para construir sites pequenos, essas ferramentas incluem <a href="https://astro.build" target="_blank">Astro</a>, <a href="https://tailwindcss.com" target="_blank">Tailwind CSS</a>, <a href="https://ui.shadcn.com" target="_blank">Shadcn UI</a> e <span class="text-zinc-800 dark:text-zinc-400">TypeScript</span>.`,
    "colophon.typography.title": "Tipografia",
    "colophon.typography.description": `Esse site usa a fonte Vercel <a href="https://vercel.com/font" target="_blank">Geist</a> que é uma fonte open source e projetada especificamente para desenvolvedores e designers.`,
    "colophon.inspiration.title": "Inspiração",
    "colophon.inspiration.description":
      "Durante a construção deste site, eu foi inspirado por muitos desenvolvedores e designers incríveis, que precisam ser mencionados aqui.",

    // 404
    "404.title": "404 Página não encontrada",
    "404.description": "A página que você está procurando não foi encontrada.",
    "404.back-home": "Voltar para início",

    // Common
    "common.back": "Voltar",
  },
} as const;
