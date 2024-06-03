import {
  type Language,
  defaultLang,
  languages,
  translations,
} from "./translations";

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split("/");
  if (lang in translations) return lang as Language;
  return defaultLang;
}

export function getTranslatedPath(lang: Language) {
  return function translatePath(path: string, l: string = lang) {
    return l === defaultLang ? path : `/${l}${path}`;
  };
}

export function getDefaultPathname(url: string | URL) {
  let result = typeof url === "string" ? url : url.pathname;
  for (const lang in languages) {
    result = result.replace(`/${lang}`, "");
  }
  return result;
}

export function useTranslations(lang: Language) {
  return function t(key: keyof (typeof translations)[typeof defaultLang]) {
    return translations[lang][key] || translations[defaultLang][key];
  };
}
