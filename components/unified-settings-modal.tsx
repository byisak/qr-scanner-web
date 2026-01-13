"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { useSettings, SystemSettings } from "@/contexts/settings-context";
import { useAuth } from "@/contexts/auth-context";
import { routing } from "@/i18n/routing";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  User,
  Mail,
  Shield,
  Key,
  Eye,
  EyeOff,
  Globe,
  Palette,
  Bell,
  Volume2,
  Table,
  Calendar,
  Clock,
  Type,
  RotateCcw,
  Check,
  X,
  Settings,
  Monitor,
} from "lucide-react";

interface UnifiedSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SettingsSection = "profile" | "general" | "notifications" | "display";

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
  const [passwordError, setPasswordError] = React.useState("");

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
      setPasswordError("");
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
        toast.success(t("profile.saveSuccess"));
        refreshUser?.();
      } else {
        const data = await res.json();
        toast.error(data.error?.message || t("profile.saveError"));
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(t("profile.saveError"));
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(t("profile.passwordMismatch"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t("profile.passwordMismatch"));
      return;
    }

    if (!validatePassword(newPassword)) {
      setPasswordError(t("profile.passwordRequirements"));
      return;
    }

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
        toast.success(t("profile.passwordChangeSuccess"));
        onOpenChange(false);
        setTimeout(() => {
          logout();
        }, 1500);
      } else {
        setPasswordError(data.error?.message || t("profile.passwordChangeError"));
      }
    } catch (error) {
      console.error("Password change error:", error);
      setPasswordError(t("profile.passwordChangeError"));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const sidebarItems: { id: SettingsSection; icon: React.ReactNode; label: string }[] = [
    { id: "profile", icon: <User className="size-4" />, label: t("settings.profile") },
    { id: "general", icon: <Settings className="size-4" />, label: t("settings.general") },
    { id: "notifications", icon: <Bell className="size-4" />, label: t("settings.notifications") },
    { id: "display", icon: <Monitor className="size-4" />, label: t("settings.display") },
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

  const renderProfileSection = () => {
    if (!user) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          {t("settings.loginRequired")}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">{t("settings.profile")}</h2>
          <p className="text-sm text-muted-foreground">{t("profile.subtitle")}</p>
        </div>

        <Separator />

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4" />
            {t("profile.name")}
          </Label>
          <div className="flex gap-2">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("profile.namePlaceholder")}
              className="flex-1"
            />
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving || !name.trim()}
              size="sm"
            >
              {isSaving ? t("profile.saving") : t("profile.save")}
            </Button>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4" />
            {t("profile.email")}
          </Label>
          <Input value={user.email} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">{t("profile.emailDesc")}</p>
        </div>

        {/* Provider */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4" />
            {t("profile.provider")}
          </Label>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {getProviderLabel(user.provider)}
            </span>
          </div>
        </div>

        {/* Password Change Section - Only for email provider */}
        {user.provider === "email" && (
          <>
            <Separator />

            {!showPasswordSection ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPasswordSection(true)}
              >
                <Key className="mr-2 h-4 w-4" />
                {t("profile.changePassword")}
              </Button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Key className="h-4 w-4" />
                    {t("profile.changePassword")}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPasswordSection(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-xs">
                    {t("profile.currentPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t("profile.currentPasswordPlaceholder")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-xs">
                    {t("profile.newPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t("profile.newPasswordPlaceholder")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("profile.passwordRequirements")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs">
                    {t("profile.confirmPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t("profile.confirmPasswordPlaceholder")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                >
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
        <div>
          <h2 className="text-lg font-semibold">{t("settings.general")}</h2>
          <p className="text-sm text-muted-foreground">{t("systemSettings.description")}</p>
        </div>

        <Separator />

        {/* Language */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <Label className="text-sm font-medium">{t("systemSettings.language")}</Label>
          </div>
          <Select
            value={localSettings.language}
            onValueChange={(value) => updateLocalSettings({ language: value })}
          >
            <SelectTrigger className="w-full">
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <Label className="text-sm font-medium">{t("systemSettings.theme")}</Label>
          </div>
          <Select
            value={localSettings.theme}
            onValueChange={(value) => updateLocalSettings({ theme: value as "light" | "dark" | "system" })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t("systemSettings.themeLight")}</SelectItem>
              <SelectItem value="dark">{t("systemSettings.themeDark")}</SelectItem>
              <SelectItem value="system">{t("systemSettings.themeSystem")}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t("settings.themeDescription")}</p>
        </div>
      </div>
    );
  };

  const renderNotificationsSection = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">{t("settings.notifications")}</h2>
          <p className="text-sm text-muted-foreground">{t("settings.notificationsDescription")}</p>
        </div>

        <Separator />

        {/* Scan Sound */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">{t("systemSettings.scanSound")}</Label>
            <p className="text-xs text-muted-foreground">{t("settings.scanSoundDescription")}</p>
          </div>
          <Switch
            checked={localSettings.scanSound}
            onCheckedChange={(checked) => updateLocalSettings({ scanSound: checked })}
          />
        </div>

        {/* Browser Notification */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">{t("systemSettings.browserNotification")}</Label>
            <p className="text-xs text-muted-foreground">{t("settings.browserNotificationDescription")}</p>
          </div>
          <Switch
            checked={localSettings.browserNotification}
            onCheckedChange={(checked) => updateLocalSettings({ browserNotification: checked })}
          />
        </div>

        <Separator />

        {/* Sound Volume */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <Label className="text-sm font-medium">{t("systemSettings.soundVolume")}</Label>
            </div>
            <span className="text-sm text-muted-foreground">
              {localSettings.soundVolume}%
            </span>
          </div>
          <Slider
            value={[localSettings.soundVolume]}
            onValueChange={(value) => updateLocalSettings({ soundVolume: value[0] })}
            max={100}
            step={10}
            className="w-full"
            disabled={!localSettings.scanSound}
          />
        </div>

        {/* Sound Type */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">{t("systemSettings.soundType")}</Label>
          <Select
            value={localSettings.soundType}
            onValueChange={(value) => updateLocalSettings({ soundType: value as "default" | "beep" | "none" })}
            disabled={!localSettings.scanSound}
          >
            <SelectTrigger className="w-full">
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
    );
  };

  const renderDisplaySection = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">{t("settings.display")}</h2>
          <p className="text-sm text-muted-foreground">{t("settings.displayDescription")}</p>
        </div>

        <Separator />

        {/* Table Rows Per Page */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            <Label className="text-sm font-medium">{t("systemSettings.tableRowsPerPage")}</Label>
          </div>
          <Select
            value={String(localSettings.tableRowsPerPage)}
            onValueChange={(value) => updateLocalSettings({ tableRowsPerPage: Number(value) })}
          >
            <SelectTrigger className="w-full">
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <Label className="text-sm font-medium">{t("systemSettings.dateFormat")}</Label>
          </div>
          <Select
            value={localSettings.dateFormat}
            onValueChange={(value) => updateLocalSettings({ dateFormat: value as SystemSettings["dateFormat"] })}
          >
            <SelectTrigger className="w-full">
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <Label className="text-sm font-medium">{t("systemSettings.timeFormat")}</Label>
          </div>
          <Select
            value={localSettings.timeFormat}
            onValueChange={(value) => updateLocalSettings({ timeFormat: value as "24h" | "12h" })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">{t("systemSettings.time24h")}</SelectItem>
              <SelectItem value="12h">{t("systemSettings.time12h")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            <Label className="text-sm font-medium">{t("systemSettings.fontSize")}</Label>
          </div>
          <Select
            value={localSettings.fontSize}
            onValueChange={(value) => updateLocalSettings({ fontSize: value as "small" | "medium" | "large" })}
          >
            <SelectTrigger className="w-full">
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
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1050px] sm:max-w-[1050px] h-[600px] p-0 gap-0 overflow-hidden [&>button]:hidden">
        <div className="flex h-full min-h-0">
          {/* Sidebar */}
          <div className="w-[220px] border-r bg-muted/30 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
              <h2 className="font-semibold text-lg">{t("settings.title")}</h2>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors",
                    activeSection === item.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Footer with action buttons */}
            <div className="p-3 border-t space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t("systemSettings.resetToDefault")}
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Close button */}
            <div className="absolute right-4 top-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              {renderContent()}
            </div>

            {/* Apply button */}
            <div className="p-4 border-t bg-background">
              <Button onClick={handleApplySettings} className="w-full">
                <Check className="h-4 w-4 mr-2" />
                {t("systemSettings.applySettings")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
