import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { DotIcon, LanguagesIcon } from "../ui/icons";

import {
  getDefaultPathname,
  getLangFromUrl,
  getTranslatedPath,
} from "../../lib/i18n";
import { languages } from "../../lib/i18n/translations";

export function LanguagesSwitch({ url }: { url: URL }) {
  const currentLang = getLangFromUrl(url);
  const defaultPath = getDefaultPathname(url);
  const href = getTranslatedPath(currentLang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-10 h-10 inline-flex items-center rounded-full justify-center">
        <LanguagesIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {Object.entries(languages).map(([lang, langName]) => (
          <DropdownMenuItem key={lang} className="justify-between" asChild>
            <a href={href(defaultPath, lang)} className="no-underline">
              {langName}
              {lang === currentLang && <DotIcon />}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
