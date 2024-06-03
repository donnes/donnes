import { BASED_CITY_LINK } from "../../constants";

export const languages = {
  en: "English",
  "pt-br": "Português (Brasil)",
};

export type Language = keyof typeof languages;

export const defaultLang = "en";

export const translations = {
  en: {
    "hero.description.1": `I'm a Senior Full-Stack & Mobile Engineer based in <a href=${BASED_CITY_LINK} target="_blank">Porto Alegre, Brazil</a>.`,
    "hero.description.2":
      "What satisfies me most is building amazing products that make people and businesses prosper.",
    "work.experience.title": "Work Experience",
  },
  "pt-br": {
    "hero.description.1": `Sou Desenvolvedor Full-Stack & Mobile e atualmente moro em <a href=${BASED_CITY_LINK} target="_blank">Porto Alegre, RS</a>.`,
    "hero.description.2":
      "O que mais me satisfaz é construir produtos incríveis que fazem pessoas e negócios prosperarem.",
    "work.experience.title": "Experiência",
  },
} as const;
