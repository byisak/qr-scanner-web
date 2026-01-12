"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";

const LOCALE_STORAGE_KEY = "preferred_locale";
const LOCALE_COOKIE = "NEXT_LOCALE";

function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};path=/;expires=${expires.toUTCString()};SameSite=Lax`;
}

export function LocaleSync() {
  const locale = useLocale();

  useEffect(() => {
    const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);

    if (storedLocale && storedLocale !== locale && routing.locales.includes(storedLocale as any)) {
      // localStorage has a different locale, sync to cookie and reload
      setCookie(LOCALE_COOKIE, storedLocale, 365);
      window.location.reload();
    } else if (!storedLocale) {
      // No stored locale, save current locale to localStorage
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
  }, [locale]);

  return null;
}
