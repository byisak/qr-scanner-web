"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages } from "lucide-react";
import { useEffect } from "react";

// Storage keys
const LOCALE_STORAGE_KEY = "preferred_locale";
const LOCALE_COOKIE = "NEXT_LOCALE";

// Helper to set cookie
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};path=/;expires=${expires.toUTCString()};SameSite=Lax`;
}

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // On mount, sync localStorage to cookie if needed
  useEffect(() => {
    const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (storedLocale && storedLocale !== locale && routing.locales.includes(storedLocale as any)) {
      // Sync localStorage value to cookie and reload
      setCookie(LOCALE_COOKIE, storedLocale, 365);
      window.location.reload();
    }
  }, [locale]);

  const handleLanguageChange = (newLocale: string) => {
    // Save to localStorage
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    // Also set cookie for server-side rendering
    setCookie(LOCALE_COOKIE, newLocale, 365);
    // Reload page to apply new locale
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <Select value={locale} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[120px] h-8">
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
