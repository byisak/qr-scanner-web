"use client";

import { useEffect } from "react";
import { useSettings } from "@/contexts/settings-context";

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  useEffect(() => {
    // 이전 폰트 크기 클래스 제거
    document.body.classList.remove("font-size-small", "font-size-medium", "font-size-large");

    // 새 폰트 크기 클래스 추가
    document.body.classList.add(`font-size-${settings.fontSize}`);
  }, [settings.fontSize]);

  return <>{children}</>;
}
