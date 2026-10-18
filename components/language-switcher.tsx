"use client";

import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages } from "lucide-react";

const LOCALE_COOKIE = "NEXT_LOCALE";

/** compact: 공개 페이지 머리글용 — 아이콘 + 언어 코드만 보이는 작은 버튼 */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("common");
  const locale = useLocale();

  const handleLanguageChange = (newLocale: string) => {
    // Set cookie with proper attributes
    document.cookie = `${LOCALE_COOKIE}=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
    // Reload page to apply new locale
    window.location.reload();
  };

  if (compact) {
    return (
      <Select value={locale} onValueChange={handleLanguageChange}>
        <SelectTrigger className="h-9 w-auto gap-1.5 rounded-full px-3 font-semibold" aria-label={t("language")}>
          <Languages className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="uppercase">{locale}</span>
        </SelectTrigger>
        <SelectContent align="end">
          {routing.locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {t(loc)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Languages className="size-4 text-muted-foreground" aria-hidden="true" />
      <Select value={locale} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[132px]" aria-label={t("language")}>
          <SelectValue placeholder={t("language")} />
        </SelectTrigger>
        <SelectContent>
          {routing.locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {t(loc)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
