"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

/**
 * 공개 페이지 머리글용 테마 선택: 라이트 · 다크 · 시스템(기기 설정을 따름, 기본값).
 * 단추에는 지금 고른 것의 아이콘만 보인다. 마운트 전에는 서버와 같게 시스템 아이콘.
 */
export function ThemeSwitcher() {
  const t = useTranslations("systemSettings");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const value = mounted ? theme ?? "system" : "system";
  const Icon = value === "light" ? Sun : value === "dark" ? Moon : Monitor;
  const items = [
    { v: "light", label: t("themeLight"), I: Sun },
    { v: "dark", label: t("themeDark"), I: Moon },
    { v: "system", label: t("themeSystem"), I: Monitor },
  ];

  return (
    <Select value={value} onValueChange={setTheme}>
      <SelectTrigger className="h-9 w-auto gap-1.5 rounded-full px-3" aria-label={t("theme")}>
        <Icon className="size-4" aria-hidden="true" />
      </SelectTrigger>
      <SelectContent align="end">
        {items.map(({ v, label, I }) => (
          <SelectItem key={v} value={v}>
            <span className="flex items-center gap-2">
              <I className="size-4 text-muted-foreground" aria-hidden="true" />
              {label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** 휴대폰 메뉴 안: 라이트 · 다크 · 시스템 세 칸 단추 */
export function ThemeSegment() {
  const t = useTranslations("systemSettings");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const value = mounted ? theme ?? "system" : "system";
  const items = [
    { v: "light", label: t("themeLight"), I: Sun },
    { v: "dark", label: t("themeDark"), I: Moon },
    { v: "system", label: t("themeSystem"), I: Monitor },
  ];
  return (
    <div role="radiogroup" aria-label={t("theme")} className="grid grid-cols-3 gap-1 rounded-field border p-1">
      {items.map(({ v, label, I }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => setTheme(v)}
          className="flex h-11 items-center justify-center gap-1.5 rounded-[calc(var(--radius-field)-4px)] text-sm font-semibold text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-checked:bg-secondary aria-checked:text-foreground"
        >
          <I className="size-4" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
