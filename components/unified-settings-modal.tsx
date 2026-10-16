"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/segmented";
import { Field, focusFirstInvalid } from "@/components/form/field";
import { PasswordInput } from "@/components/form/password-input";
import { useSettings, SystemSettings } from "@/contexts/settings-context";
import { useAuth, type AuthError } from "@/contexts/auth-context";
import { routing } from "@/i18n/routing";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { User, Key, Bell, RotateCcw, Check, Settings, Monitor } from "lucide-react";

interface UnifiedSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SettingsSection = "profile" | "general" | "notifications" | "display";

type PasswordErrors = { current: string; next: string; confirm: string };
const NO_PASSWORD_ERRORS: PasswordErrors = { current: "", next: "", confirm: "" };

/** 설정 한 줄: 왼쪽 이름·설명, 오른쪽 스위치 (이름·설명이 스위치에 연결된다) */
function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 space-y-0.5">
        <label htmlFor={id} className="text-15 font-bold">
          {label}
        </label>
        <p id={`${id}-desc`} className="text-13 text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch id={id} aria-describedby={`${id}-desc`} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function UnifiedSettingsModal({ open, onOpenChange }: UnifiedSettingsModalProps) {
  const t = useTranslations();
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme: currentTheme, setTheme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { user, accessToken, refreshUser, logout } = useAuth();

  const [activeSection, setActiveSection] = React.useState<SettingsSection>("profile");

  // Local state for system settings (not applied until button click)
  const [localSettings, setLocalSettings] = React.useState<SystemSettings>({
    ...settings,
    language: currentLocale,
    theme: (currentTheme as "light" | "dark" | "system") || "system",
  });

  // Profile state
  const [name, setName] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  // Password state
  const [showPasswordSection, setShowPasswordSection] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordErrors, setPasswordErrors] = React.useState<PasswordErrors>(NO_PASSWORD_ERRORS);
  const passwordFormRef = React.useRef<HTMLFormElement>(null);

  // Reset states when modal opens
  React.useEffect(() => {
    if (open) {
      setLocalSettings({
        ...settings,
        language: currentLocale,
        theme: (currentTheme as "light" | "dark" | "system") || "system",
      });
      if (user) {
        setName(user.name || "");
      }
      setShowPasswordSection(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors(NO_PASSWORD_ERRORS);
    }
  }, [open, settings, currentLocale, currentTheme, user]);

  // Update local settings
  const updateLocalSettings = (newSettings: Partial<SystemSettings>) => {
    setLocalSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Apply all settings
  const handleApplySettings = async () => {
    // Request browser notification permission if enabled
    if (localSettings.browserNotification && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setLocalSettings((prev) => ({ ...prev, browserNotification: false }));
        updateSettings({ ...localSettings, browserNotification: false });
      } else {
        updateSettings(localSettings);
      }
    } else {
      updateSettings(localSettings);
    }

    // Apply theme
    setTheme(localSettings.theme);

    // Check if language changed
    const languageChanged = localSettings.language !== currentLocale;

    // Close modal
    onOpenChange(false);

    // If language changed, navigate to new locale path without reload
    if (languageChanged) {
      document.cookie = `NEXT_LOCALE=${localSettings.language};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
      // Replace current locale in path with new locale
      const newPathname = pathname.replace(`/${currentLocale}`, `/${localSettings.language}`);
      router.replace(newPathname);
    }
  };

  // Reset all settings to default
  const handleReset = () => {
    const defaultSettings: SystemSettings = {
      language: "en",
      theme: "system",
      scanSound: true,
      browserNotification: false,
      soundVolume: 50,
      soundType: "default",
      tableRowsPerPage: 25,
      dateFormat: "YYYY-MM-DD",
      timeFormat: "24h",
      fontSize: "medium",
    };
    setLocalSettings(defaultSettings);
  };

  // Profile functions
  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case "email":
        return t("profile.providerEmail");
      case "google":
        return t("profile.providerGoogle");
      case "apple":
        return t("profile.providerApple");
      case "kakao":
        return t("profile.providerKakao");
      default:
        return provider;
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.ok) {
        notify.success(t("profile.saveSuccess"));
        refreshUser?.();
      } else {
        // 서버 문구 대신 해요체 문구
        notify.error(t("profile.saveError"));
      }
    } catch {
      notify.error(t("profile.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) return false;
    if (!/[A-Za-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  };

  const showPasswordErrors = (next: PasswordErrors) => {
    setPasswordErrors(next);
    requestAnimationFrame(() => focusFirstInvalid(passwordFormRef.current));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사 (오류는 해당 입력 아래에)
    const next: PasswordErrors = {
      current: currentPassword ? "" : t("profile.passwordRequired"),
      next: !newPassword
        ? t("profile.passwordRequired")
        : !validatePassword(newPassword)
          ? t("profile.passwordRequirements")
          : "",
      confirm: newPassword !== confirmPassword ? t("profile.passwordMismatch") : "",
    };
    if (next.current || next.next || next.confirm) {
      showPasswordErrors(next);
      return;
    }
    setPasswordErrors(NO_PASSWORD_ERRORS);

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        notify.success(t("profile.passwordChangeSuccess"));
        onOpenChange(false);
        setTimeout(() => {
          logout();
        }, 1500);
      } else {
        const code = (data as { error?: AuthError })?.error?.code;
        if (code === "AUTH_INVALID_CREDENTIALS") {
          showPasswordErrors({ ...NO_PASSWORD_ERRORS, current: t("profile.wrongCurrentPassword") });
        } else if (code === "AUTH_VALIDATION_ERROR") {
          showPasswordErrors({ ...NO_PASSWORD_ERRORS, next: t("profile.passwordRequirements") });
        } else {
          notify.error(t("profile.passwordChangeError"));
        }
      }
    } catch {
      notify.error(t("profile.passwordChangeError"));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const sidebarItems: { id: SettingsSection; icon: React.ReactNode; label: string }[] = [
    { id: "profile", icon: <User aria-hidden="true" />, label: t("settings.profile") },
    { id: "general", icon: <Settings aria-hidden="true" />, label: t("settings.general") },
    { id: "notifications", icon: <Bell aria-hidden="true" />, label: t("settings.notifications") },
    { id: "display", icon: <Monitor aria-hidden="true" />, label: t("settings.display") },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return renderProfileSection();
      case "general":
        return renderGeneralSection();
      case "notifications":
        return renderNotificationsSection();
      case "display":
        return renderDisplaySection();
      default:
        return null;
    }
  };

  const sectionHead = (title: string, description: string) => (
    <div>
      <h3 className="type-h3">{title}</h3>
      <p className="mt-1 text-15 text-muted-foreground">{description}</p>
    </div>
  );

  const renderProfileSection = () => {
    if (!user) {
      return (
        <div className="flex h-full items-center justify-center text-15 text-muted-foreground">
          {t("settings.loginRequired")}
        </div>
      );
    }

    const toggleLabels = { showLabel: t("profile.showPassword"), hideLabel: t("profile.hidePassword") };

    return (
      <div className="space-y-6">
        {sectionHead(t("settings.profile"), t("profile.subtitle"))}

        <Separator />

        <Field label={t("profile.name")} id="settings-name">
          {(p) => (
            <div className="flex gap-2">
              <Input
                {...p}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("profile.namePlaceholder")}
                autoComplete="name"
                className="min-w-0 flex-1"
              />
              <Button onClick={handleSaveProfile} disabled={isSaving || !name.trim()}>
                {isSaving ? t("profile.saving") : t("profile.save")}
              </Button>
            </div>
          )}
        </Field>

        <Field label={t("profile.email")} id="settings-email" help={t("profile.emailDesc")}>
          <Input value={user.email} disabled readOnly className="bg-secondary" />
        </Field>

        <div className="grid gap-2">
          <p className="text-15 font-bold">{t("profile.provider")}</p>
          <div>
            <Badge variant="secondary">{getProviderLabel(user.provider)}</Badge>
          </div>
        </div>

        {/* Password Change Section - Only for email provider */}
        {user.provider === "email" && (
          <>
            <Separator />

            {!showPasswordSection ? (
              <Button variant="outline" className="w-full" onClick={() => setShowPasswordSection(true)}>
                <Key aria-hidden="true" />
                {t("profile.changePassword")}
              </Button>
            ) : (
              <form ref={passwordFormRef} onSubmit={handleChangePassword} noValidate className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="flex items-center gap-2 text-15 font-bold">
                    <Key className="size-4" aria-hidden="true" />
                    {t("profile.changePassword")}
                  </h4>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowPasswordSection(false)}>
                    {t("common.cancel")}
                  </Button>
                </div>

                <Field label={t("profile.currentPassword")} id="currentPassword" error={passwordErrors.current}>
                  <PasswordInput
                    {...toggleLabels}
                    shown={showCurrentPassword}
                    onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t("profile.currentPasswordPlaceholder")}
                    autoComplete="current-password"
                  />
                </Field>

                <Field
                  label={t("profile.newPassword")}
                  id="newPassword"
                  error={passwordErrors.next}
                  help={t("profile.passwordRequirements")}
                >
                  <PasswordInput
                    {...toggleLabels}
                    shown={showNewPassword}
                    onToggle={() => setShowNewPassword(!showNewPassword)}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("profile.newPasswordPlaceholder")}
                    autoComplete="new-password"
                  />
                </Field>

                <Field label={t("profile.confirmPassword")} id="confirmPassword" error={passwordErrors.confirm}>
                  <PasswordInput
                    {...toggleLabels}
                    shown={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("profile.confirmPasswordPlaceholder")}
                    autoComplete="new-password"
                  />
                </Field>

                <Button type="submit" className="w-full" disabled={isChangingPassword}>
                  {isChangingPassword ? t("profile.saving") : t("profile.changePassword")}
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    );
  };

  const renderGeneralSection = () => {
    return (
      <div className="space-y-6">
        {sectionHead(t("settings.general"), t("systemSettings.description"))}

        <Separator />

        <Field label={t("systemSettings.language")} id="settings-language">
          {(p) => (
            <Select value={localSettings.language} onValueChange={(value) => updateLocalSettings({ language: value })}>
              <SelectTrigger {...p}>
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
          )}
        </Field>

        <Field label={t("systemSettings.theme")} id="settings-theme" help={t("settings.themeDescription")}>
          {(p) => (
            <Select
              value={localSettings.theme}
              onValueChange={(value) => updateLocalSettings({ theme: value as "light" | "dark" | "system" })}
            >
              <SelectTrigger {...p}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t("systemSettings.themeLight")}</SelectItem>
                <SelectItem value="dark">{t("systemSettings.themeDark")}</SelectItem>
                <SelectItem value="system">{t("systemSettings.themeSystem")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </Field>
      </div>
    );
  };

  const renderNotificationsSection = () => {
    return (
      <div className="space-y-6">
        {sectionHead(t("settings.notifications"), t("settings.notificationsDescription"))}

        <Separator />

        <SwitchRow
          id="settings-scan-sound"
          label={t("systemSettings.scanSound")}
          description={t("settings.scanSoundDescription")}
          checked={localSettings.scanSound}
          onCheckedChange={(checked) => updateLocalSettings({ scanSound: checked })}
        />

        <SwitchRow
          id="settings-browser-notification"
          label={t("systemSettings.browserNotification")}
          description={t("settings.browserNotificationDescription")}
          checked={localSettings.browserNotification}
          onCheckedChange={(checked) => updateLocalSettings({ browserNotification: checked })}
        />

        <Separator />

        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <span id="settings-volume-label" className="text-15 font-bold">
              {t("systemSettings.soundVolume")}
            </span>
            <span className="tabular text-15 text-muted-foreground">{localSettings.soundVolume}%</span>
          </div>
          <Slider
            aria-label={t("systemSettings.soundVolume")}
            value={[localSettings.soundVolume]}
            onValueChange={(value) => updateLocalSettings({ soundVolume: value[0] })}
            max={100}
            step={10}
            className="w-full"
            disabled={!localSettings.scanSound}
          />
        </div>

        <Field label={t("systemSettings.soundType")} id="settings-sound-type">
          {(p) => (
            <Select
              value={localSettings.soundType}
              onValueChange={(value) => updateLocalSettings({ soundType: value as "default" | "beep" | "none" })}
              disabled={!localSettings.scanSound}
            >
              <SelectTrigger {...p}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{t("systemSettings.soundDefault")}</SelectItem>
                <SelectItem value="beep">{t("systemSettings.soundBeep")}</SelectItem>
                <SelectItem value="none">{t("systemSettings.soundNone")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </Field>
      </div>
    );
  };

  const renderDisplaySection = () => {
    return (
      <div className="space-y-6">
        {sectionHead(t("settings.display"), t("settings.displayDescription"))}

        <Separator />

        <Field label={t("systemSettings.tableRowsPerPage")} id="settings-rows">
          {(p) => (
            <Select
              value={String(localSettings.tableRowsPerPage)}
              onValueChange={(value) => updateLocalSettings({ tableRowsPerPage: Number(value) })}
            >
              <SelectTrigger {...p} className="tabular">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          )}
        </Field>

        <Field label={t("systemSettings.dateFormat")} id="settings-date-format">
          {(p) => (
            <Select
              value={localSettings.dateFormat}
              onValueChange={(value) => updateLocalSettings({ dateFormat: value as SystemSettings["dateFormat"] })}
            >
              <SelectTrigger {...p}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              </SelectContent>
            </Select>
          )}
        </Field>

        <Field label={t("systemSettings.timeFormat")} id="settings-time-format">
          {(p) => (
            <Select
              value={localSettings.timeFormat}
              onValueChange={(value) => updateLocalSettings({ timeFormat: value as "24h" | "12h" })}
            >
              <SelectTrigger {...p}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">{t("systemSettings.time24h")}</SelectItem>
                <SelectItem value="12h">{t("systemSettings.time12h")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </Field>

        {/* 글자 크기 (모든 글자 단계에 배율로 적용) */}
        <Field label={t("systemSettings.fontSize")} id="settings-font-size">
          {(p) => (
            <Select
              value={localSettings.fontSize}
              onValueChange={(value) => updateLocalSettings({ fontSize: value as "small" | "medium" | "large" })}
            >
              <SelectTrigger {...p}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">{t("systemSettings.fontSmall")}</SelectItem>
                <SelectItem value="medium">{t("systemSettings.fontMedium")}</SelectItem>
                <SelectItem value="large">{t("systemSettings.fontLarge")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </Field>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 넓은 화면: 왼쪽 메뉴 + 내용 (높이 640 이내). 좁은 화면(<640): 화면 전체를 채우고 메뉴는 위쪽 세그먼트 */}
      <DialogContent
        aria-describedby={undefined}
        closeLabel={t("common.close")}
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0",
          "max-sm:inset-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0",
          "sm:h-[min(640px,calc(100dvh-2rem))] sm:max-w-[880px] sm:flex-row"
        )}
      >
        {/* 메뉴 (640px 이상) */}
        <div className="hidden w-[220px] shrink-0 flex-col border-r bg-background/60 sm:flex">
          <div className="px-5 pb-3 pt-5">
            <DialogTitle className="type-h3">{t("settings.title")}</DialogTitle>
          </div>

          <nav aria-label={t("settings.title")} className="flex-1 space-y-1 px-3">
            {sidebarItems.map((item) => {
              const current = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={current ? "page" : undefined}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "press flex h-10 w-full items-center gap-3 rounded-field px-3 text-15 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0",
                    current
                      ? "bg-secondary font-bold text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="border-t p-3">
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleReset}>
              <RotateCcw aria-hidden="true" />
              {t("systemSettings.resetToDefault")}
            </Button>
          </div>
        </div>

        {/* 내용 */}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {/* 좁은 화면 머리: 제목 + 닫기, 아래 세그먼트 메뉴 */}
          <div className="border-b px-4 pb-3 pt-3 sm:hidden">
            <p className="type-h3 pr-10" aria-hidden="true">
              {t("settings.title")}
            </p>
            <Segmented
              aria-label={t("settings.title")}
              className="mt-3 w-full"
              value={activeSection}
              onValueChange={setActiveSection}
              options={sidebarItems.map((item) => ({ value: item.id, label: item.label }))}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:p-6 sm:pr-14">{renderContent()}</div>

          <div className="flex gap-2 border-t bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button variant="outline" className="sm:hidden" onClick={handleReset}>
              <RotateCcw aria-hidden="true" />
              {t("systemSettings.resetShort")}
            </Button>
            <Button onClick={handleApplySettings} className="flex-1">
              <Check aria-hidden="true" />
              {t("systemSettings.applySettings")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
