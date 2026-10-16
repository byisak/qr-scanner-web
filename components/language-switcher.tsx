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

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();

  const handleLanguageChange = (newLocale: string) => {
    // Set cookie with proper attributes
    document.cookie = `${LOCALE_COOKIE}=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
    // Reload page to apply new locale
    window.location.reload();
  };

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
