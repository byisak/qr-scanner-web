"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/settings-context";
import { routing } from "@/i18n/routing";
import {
  Globe,
  Palette,
  Bell,
  Volume2,
  Table,
  Calendar,
  Clock,
  Type,
  RotateCcw,
} from "lucide-react";

interface SystemSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SystemSettingsModal({ open, onOpenChange }: SystemSettingsModalProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, resetSettings } = useSettings();

  // Language change handler
  const handleLanguageChange = (newLocale: string) => {
    updateSettings({ language: newLocale });
    // Set cookie and reload
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
    window.location.reload();
  };

  // Theme change handler
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    updateSettings({ theme: newTheme as "light" | "dark" | "system" });
  };

  // Reset all settings
  const handleReset = () => {
    resetSettings();
    setTheme("system");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("systemSettings.title")}</DialogTitle>
          <DialogDescription>{t("systemSettings.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Language & Theme Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t("systemSettings.languageAndTheme")}
            </h3>

            {/* Language */}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="language" className="text-right text-sm">
                {t("systemSettings.language")}
              </Label>
              <Select value={locale} onValueChange={handleLanguageChange}>
                <SelectTrigger className="col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {routing.locales.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {t(`common.${loc}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Theme */}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="theme" className="text-right text-sm flex items-center gap-1 justify-end">
                <Palette className="h-3 w-3" />
                {t("systemSettings.theme")}
              </Label>
              <Select value={theme || "system"} onValueChange={handleThemeChange}>
                <SelectTrigger className="col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t("systemSettings.themeLight")}</SelectItem>
                  <SelectItem value="dark">{t("systemSettings.themeDark")}</SelectItem>
                  <SelectItem value="system">{t("systemSettings.themeSystem")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Notification Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {t("systemSettings.notifications")}
            </h3>

            {/* Scan Sound */}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="scanSound" className="text-right text-sm">
                {t("systemSettings.scanSound")}
              </Label>
              <div className="col-span-2 flex items-center">
                <Switch
                  id="scanSound"
                  checked={settings.scanSound}
                  onCheckedChange={(checked) => updateSettings({ scanSound: checked })}
                />
              </div>
            </div>

            {/* Browser Notification */}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="browserNotification" className="text-right text-sm">
                {t("systemSettings.browserNotification")}
              </Label>
              <div className="col-span-2 flex items-center">
                <Switch
                  id="browserNotification"
                  checked={settings.browserNotification}
                  onCheckedChange={(checked) => {
                    if (checked && "Notification" in window) {
                      Notification.requestPermission().then((permission) => {
                        updateSettings({ browserNotification: permission === "granted" });
                      });
                    } else {
                      updateSettings({ browserNotification: checked });
                    }
                  }}
                />
              </div>
            </div>

            {/* Sound Volume */}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-right text-sm flex items-center gap-1 justify-end">
                <Volume2 className="h-3 w-3" />
                {t("systemSettings.soundVolume")}
              </Label>
              <div className="col-span-2 flex items-center gap-3">
                <Slider
                  value={[settings.soundVolume]}
                  onValueChange={(value) => updateSettings({ soundVolume: value[0] })}
                  max={100}
                  step={10}
                  className="flex-1"
                  disabled={!settings.scanSound}
                />
                <span className="text-sm text-muted-foreground w-10 text-right">
                  {settings.soundVolume}%
                </span>
              </div>
            </div>

            {/* Sound Type */}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="soundType" className="text-right text-sm">
                {t("systemSettings.soundType")}
              </Label>
              <Select
                value={settings.soundType}
                onValueChange={(value) => updateSettings({ soundType: value as "default" | "beep" | "none" })}
                disabled={!settings.scanSound}
              >
                <SelectTrigger className="col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t("systemSettings.soundDefault")}</SelectItem>
                  <SelectItem value="beep">{t("systemSettings.soundBeep")}</SelectItem>
                  <SelectItem value="none">{t("systemSettings.soundNone")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Display Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Table className="h-4 w-4" />
              {t("systemSettings.display")}
            </h3>

            {/* Table Rows Per Page */}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="tableRows" className="text-right text-sm">
                {t("systemSettings.tableRowsPerPage")}
              </Label>
              <Select
                value={String(settings.tableRowsPerPage)}
                onValueChange={(value) => updateSettings({ tableRowsPerPage: Number(value) })}
              >
                <SelectTrigger className="col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Format */}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-right text-sm flex items-center gap-1 justify-end">
                <Calendar className="h-3 w-3" />
                {t("systemSettings.dateFormat")}
              </Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(value) => updateSettings({ dateFormat: value as SystemSettings["dateFormat"] })}
              >
                <SelectTrigger className="col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Format */}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-right text-sm flex items-center gap-1 justify-end">
                <Clock className="h-3 w-3" />
                {t("systemSettings.timeFormat")}
              </Label>
              <Select
                value={settings.timeFormat}
                onValueChange={(value) => updateSettings({ timeFormat: value as "24h" | "12h" })}
              >
                <SelectTrigger className="col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">{t("systemSettings.time24h")}</SelectItem>
                  <SelectItem value="12h">{t("systemSettings.time12h")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-right text-sm flex items-center gap-1 justify-end">
                <Type className="h-3 w-3" />
                {t("systemSettings.fontSize")}
              </Label>
              <Select
                value={settings.fontSize}
                onValueChange={(value) => updateSettings({ fontSize: value as "small" | "medium" | "large" })}
              >
                <SelectTrigger className="col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">{t("systemSettings.fontSmall")}</SelectItem>
                  <SelectItem value="medium">{t("systemSettings.fontMedium")}</SelectItem>
                  <SelectItem value="large">{t("systemSettings.fontLarge")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Reset Button */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t("systemSettings.resetToDefault")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Type export for external use
type SystemSettings = import("@/contexts/settings-context").SystemSettings;
