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
    "home.hero.description.1": `I'm a Senior Full-Stack & Mobile Engineer based in <strong itemprop="addressLocality">${CITY}</strong>.`,
    "home.hero.description.2":
      "What satisfies me most is building amazing products that make people and businesses prosper.",
    "home.experience.title": "Work Experience",
    "cv.summary":
      "Founding Engineer with 10+ years building production systems across Fintech, E-commerce, and SaaS. Currently architecting AI-powered B2B solutions at Levers (YC S22) that automate financial operations at scale. Led platform modernizations, rebuilt legacy systems, and shipped mobile applications from scratch. Specialized in Full-Stack and Mobile development, delivering high-impact solutions from concept to deployment.",

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
    "home.hero.description.1": `Sou Desenvolvedor Full-Stack & Mobile e atualmente moro em <strong itemprop="addressLocality">${CITY}</strong>.`,
    "home.hero.description.2":
      "O que mais me satisfaz é construir produtos incríveis que fazem pessoas e negócios prosperarem.",
    "home.experience.title": "Experiência",
    "cv.summary":
      "Founding Engineer com mais de 10 anos construindo sistemas de produção em Fintech, E-commerce e SaaS. Atualmente, lidero a arquitetura de soluções B2B com IA na Levers (YC S22) que automatizam operações financeiras em escala. Liderei modernizações de plataformas, reconstruí sistemas legados e lancei aplicativos móveis do zero. Especializado em desenvolvimento Full-Stack e Mobile, entregando soluções de alto impacto do conceito à implantação.",

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
