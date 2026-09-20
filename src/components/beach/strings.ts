// Every user-visible or aria string of the beach homepage, in English and Brazilian Portuguese.
// `client` is serialised into the page (a JSON script tag) for the scene script: it must stay plain data.

import { CITY, SITE } from "../../constants";

export type BeachLang = "en" | "pt-br";

type ClientStrings = {
  /** local-time phases of the day, keyed by the scene's internal phase id */
  phase: Record<"night" | "dawn" | "morning" | "midday" | "afternoon" | "golden" | "dusk", string>;
  /** sky names for preview presets, keyed by the scene's internal sky id */
  sky: Record<"clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "heavy" | "storm", string>;
  /** names for live Open-Meteo weather codes */
  code: Record<"clear" | "mostlyClear" | "partly" | "overcast" | "fog" | "drizzle" | "lightRain" | "rain" | "heavyRain" | "freezingRain" | "snow" | "snowShowers" | "storm", string>;
  windy: string;
  wind: string;
  /** N, NE, E, SE, S, SW, W, NW */
  compass: string[];
  copy: string;
  copied: string;
  copyFailed: string;
};

export type BeachStrings = {
  htmlLang: string;
  title: string;
  description: string;
  now: string;
  years: (n: number) => string;
  currentRole: string;
  firstRole: string;
  chapter: (numeral: string, total: string) => string;
  currently: (company: string) => string;
  preview: string;
  nav: { objects: string; dock: string; language: string };
  work: { label: string; sub: string; aria: string; hint: string; roles: string; folio: string; builtAt: (company: string) => string; pageAria: (company: string) => string; prev: string; next: string; close: string };
  about: { label: string; aria: string; since: string; roles: string; tools: string; currently: string; basedIn: string; country: string; colophon: string };
  stack: { label: string; aria: string; eyebrow: string; lede: string };
  contact: { label: string; aria: string; eyebrow: string; heading: string; hello: string; letter: string; email: string; cv: string; copyAria: string; stamp: string; postmark: (role: string, year: number) => string; sign: string };
  ball: string;
  closePanel: string;
  client: ClientStrings;
};

export const STRINGS: Record<BeachLang, BeachStrings> = {
  en: {
    htmlLang: "en",
    title: `${SITE.TITLE} — ${SITE.ROLE}`,
    description: SITE.DESCRIPTION,
    now: "now",
    years: (n) => `${n} ${n === 1 ? "year" : "years"}`,
    currentRole: "current role",
    firstRole: "where it started",
    chapter: (numeral, total) => `chapter ${numeral} of ${total}`,
    currently: (company) => `Currently building at ${company}`,
    preview: "preview",
    nav: { objects: "Things on the beach", dock: "Jump to", language: "Language" },
    work: {
      label: "Work",
      sub: "what I’ve built",
      aria: "Work — what I’ve built (the notebook on the beach towel)",
      hint: "start here",
      roles: "Roles, newest first",
      folio: "N°",
      builtAt: (company) => `Built at ${company}`,
      pageAria: (company) => `${company} — what I built`,
      prev: "Previous role (newer)",
      next: "Next role (older)",
      close: "Close the notebook and put it back on the towel",
    },
    about: {
      label: "About",
      aria: "About — the postcard under the beach umbrella",
      since: "shipping since",
      roles: "roles so far",
      tools: "tools in the stack",
      currently: "currently",
      basedIn: "Based in",
      country: "Brazil",
      colophon: "Colophon",
    },
    stack: {
      label: "Stack",
      aria: "Stack — what’s in the cooler box",
      eyebrow: "What I build with",
      lede: "AI-first, product-minded. What I reach for today.",
    },
    contact: {
      label: "Contact",
      aria: "Contact — the message in a bottle",
      eyebrow: "The message in the bottle",
      heading: "Say hello",
      hello: "Say hello",
      letter: "Have a product to build, or a role that fits? Email is the fastest way to reach me.",
      email: "Email",
      cv: "CV",
      copyAria: "Copy email address",
      stamp: "HELLO",
      postmark: (role, year) => `${role} · shipping since ${year} ·`,
      sign: "— Donald",
    },
    ball: "Beach ball — give it a poke",
    closePanel: "Close and put it back on the sand",
    client: {
      phase: { night: "night", dawn: "dawn", morning: "morning", midday: "midday", afternoon: "afternoon", golden: "golden hour", dusk: "dusk" },
      sky: { clear: "clear", partly: "partly cloudy", cloudy: "overcast", fog: "fog", drizzle: "drizzle", rain: "rain", heavy: "heavy rain", storm: "storm" },
      code: { clear: "clear", mostlyClear: "mostly clear", partly: "partly cloudy", overcast: "overcast", fog: "fog", drizzle: "drizzle", lightRain: "light rain", rain: "rain", heavyRain: "heavy rain", freezingRain: "freezing rain", snow: "snow", snowShowers: "snow showers", storm: "storm" },
      windy: "windy",
      wind: "wind",
      compass: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
      copy: "copy",
      copied: "copied ✓",
      copyFailed: "select it instead",
    },
  },
  "pt-br": {
    htmlLang: "pt-BR",
    title: `${SITE.TITLE} — ${SITE.ROLE}`,
    description: `Sou ${SITE.ROLE} e moro em ${CITY}.`,
    now: "hoje",
    years: (n) => `${n} ${n === 1 ? "ano" : "anos"}`,
    currentRole: "cargo atual",
    firstRole: "onde tudo começou",
    chapter: (numeral, total) => `capítulo ${numeral} de ${total}`,
    currently: (company) => `Atualmente construindo na ${company}`,
    preview: "prévia",
    nav: { objects: "Objetos na praia", dock: "Ir para", language: "Idioma" },
    work: {
      label: "Trabalho",
      sub: "o que eu construí",
      aria: "Trabalho — o que eu construí (o caderno sobre a toalha de praia)",
      hint: "comece aqui",
      roles: "Cargos, do mais recente ao mais antigo",
      folio: "Nº",
      builtAt: (company) => `Construído na ${company}`,
      pageAria: (company) => `${company} — o que eu construí`,
      prev: "Cargo anterior (mais recente)",
      next: "Próximo cargo (mais antigo)",
      close: "Fechar o caderno e devolvê-lo à toalha",
    },
    about: {
      label: "Sobre",
      aria: "Sobre — o cartão-postal debaixo do guarda-sol",
      since: "construindo desde",
      roles: "cargos até aqui",
      tools: "ferramentas na stack",
      currently: "atualmente",
      basedIn: "Moro em",
      country: "Brasil",
      colophon: "Colophon",
    },
    stack: {
      label: "Stack",
      aria: "Stack — o que tem no cooler",
      eyebrow: "Com o que eu construo",
      lede: "AI-first, com foco em produto. O que eu uso hoje.",
    },
    contact: {
      label: "Contato",
      aria: "Contato — a mensagem na garrafa",
      eyebrow: "A mensagem na garrafa",
      heading: "Diga olá",
      hello: "Diga olá",
      letter: "Tem um produto para construir ou uma vaga que combina comigo? E-mail é o jeito mais rápido de falar comigo.",
      email: "E-mail",
      cv: "CV",
      copyAria: "Copiar endereço de e-mail",
      stamp: "OLÁ",
      postmark: (role, year) => `${role} · criando desde ${year} ·`,
      sign: "— Donald",
    },
    ball: "Bola de praia — dê um toque",
    closePanel: "Fechar e devolver à areia",
    client: {
      phase: { night: "noite", dawn: "amanhecer", morning: "manhã", midday: "meio-dia", afternoon: "tarde", golden: "fim de tarde", dusk: "entardecer" },
      sky: { clear: "céu limpo", partly: "parcialmente nublado", cloudy: "nublado", fog: "neblina", drizzle: "garoa", rain: "chuva", heavy: "chuva forte", storm: "tempestade" },
      code: { clear: "céu limpo", mostlyClear: "poucas nuvens", partly: "parcialmente nublado", overcast: "nublado", fog: "neblina", drizzle: "garoa", lightRain: "chuva fraca", rain: "chuva", heavyRain: "chuva forte", freezingRain: "chuva congelante", snow: "neve", snowShowers: "pancadas de neve", storm: "tempestade" },
      windy: "ventania",
      wind: "vento",
      compass: ["N", "NE", "L", "SE", "S", "SO", "O", "NO"],
      copy: "copiar",
      copied: "copiado ✓",
      copyFailed: "selecione o texto",
    },
  },
};
