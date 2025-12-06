"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { locales } from "@/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    // Remove the current locale from the pathname
    const pathnameWithoutLocale = pathname.replace(`/${locale}`, "");

    // Redirect to the new locale
    router.push(`/${newLocale}${pathnameWithoutLocale}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <Select value={locale} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={t("language")} />
        </SelectTrigger>
        <SelectContent>
          {locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {loc === "ko" ? t("korean") : t("english")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
